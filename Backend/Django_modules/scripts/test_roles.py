from rest_framework import status
from Dashboard.views import AIRecommendationsView, RecomendacionIA_ViewSet
from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model
import django
import os
import sys
# Ensure project path is in sys.path before importing Django
sys.path.insert(0, os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Django_modules.settings')
django.setup()


User = get_user_model()


def ensure_user(username, password='pass'):
    u, created = User.objects.get_or_create(username=username)
    if created:
        u.set_password(password)
        u.save()
    return u


def main():
    # preparar usuarios
    emp = ensure_user('empleado_test')
    ger = ensure_user('gerente_test')
    sup = ensure_user('super_test')
    sup.is_superuser = True
    sup.is_staff = True
    sup.save()

    # asignar grupos
    gerente_g = Group.objects.filter(name='Gerente').first()
    empleado_g = Group.objects.filter(name='Empleado').first()
    if gerente_g:
        gerente_g.user_set.add(ger)
    if empleado_g:
        empleado_g.user_set.add(emp)

    factory = APIRequestFactory()

    # Probar AIRecommendationsView POST
    view = AIRecommendationsView.as_view()
    req_emp = factory.post('/api/ai/', {}, format='json')
    force_authenticate(req_emp, user=emp)
    resp_emp = view(req_emp)

    req_ger = factory.post('/api/ai/', {}, format='json')
    force_authenticate(req_ger, user=ger)
    resp_ger = view(req_ger)

    req_sup = factory.post('/api/ai/', {}, format='json')
    force_authenticate(req_sup, user=sup)
    resp_sup = view(req_sup)

    print('Empleado -> AIRecommendations POST status:', resp_emp.status_code)
    print('Gerente  -> AIRecommendations POST status:', resp_ger.status_code)
    print('Superuser-> AIRecommendations POST status:', resp_sup.status_code)

    # Probar RecomendacionIA_ViewSet create (similar)
    rview = RecomendacionIA_ViewSet.as_view({'post': 'create'})
    req_emp2 = factory.post('/api/recomendaciones/', {}, format='json')
    force_authenticate(req_emp2, user=emp)
    resp_emp2 = rview(req_emp2)
    print('Empleado -> RecomendacionIA create status:', resp_emp2.status_code)


if __name__ == '__main__':
    main()
