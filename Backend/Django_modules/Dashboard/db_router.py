import threading
from typing import Optional

_state = threading.local()


def set_db_for_request(db_alias: Optional[str]):
    if db_alias:
        _state.db = db_alias
    else:
        if hasattr(_state, 'db'):
            delattr(_state, 'db')


def get_db_for_request() -> Optional[str]:
    return getattr(_state, 'db', None)


class RequestDBRouterMiddleware:
    """Middleware ligero que asigna un alias de BD en base al prefijo de la URL.

    - /api/  -> None (usa default)
    - /api2/ -> 'store_b'
    - /api3/ -> 'store_c'
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path or ''
        if path.startswith('/api2/'):
            set_db_for_request('store_b')
        elif path.startswith('/api3/'):
            set_db_for_request('store_c')
        else:
            set_db_for_request(None)

        try:
            response = self.get_response(request)
            return response
        finally:
            # limpiar estado para evitar fugas entre requests
            set_db_for_request(None)


class PathRouter:
    """Database router que enruta lecturas/escrituras según el alias establecido
    por la middleware (get_db_for_request()). Si no hay alias, devuelve None
    para permitir que el comportamiento por defecto (default) se aplique.
    """

    def db_for_read(self, model, **hints):
        alias = get_db_for_request()
        return alias

    def db_for_write(self, model, **hints):
        alias = get_db_for_request()
        return alias

    def allow_relation(self, obj1, obj2, **hints):
        # Permitir relaciones solo si ambos objetos están en la misma conexión
        db_obj1 = getattr(obj1._state, 'db', None)
        db_obj2 = getattr(obj2._state, 'db', None)
        if db_obj1 and db_obj2:
            return db_obj1 == db_obj2
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        # Permitir migraciones en todas las conexiones configuradas para crear
        # tablas en las DBs adicionales (el desarrollador puede limitar esto).
        return True
