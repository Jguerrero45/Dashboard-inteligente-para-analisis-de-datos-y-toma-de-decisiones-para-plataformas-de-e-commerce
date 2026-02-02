import React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Mail, MessageCircle } from "lucide-react"

const WHATSAPP_NUMBER = "+584245400687"
const WHATSAPP_LINK = "https://wa.me/584245400687"
const CONTACT_EMAIL = "guerrerojosegarcia@gmail.com"

const Contact: React.FC = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Contacto</CardTitle>
                    <CardDescription>Solicita acceso o más información</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="mb-4 text-sm text-muted-foreground">
                        Este sistema es de uso exclusivo para clientes contratados. Las cuentas son creadas únicamente por el
                        administrador del servicio. Para solicitar acceso, por favor contacta al equipo comercial a través de WhatsApp o correo electrónico.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="w-full">
                            <Button className="w-full flex items-center justify-center gap-2" variant="outline">
                                <MessageCircle /> Contactar por WhatsApp
                            </Button>
                        </a>
                        <a href={`mailto:${CONTACT_EMAIL}`} className="w-full">
                            <Button className="w-full flex items-center justify-center gap-2">
                                <Mail /> Enviar correo
                            </Button>
                        </a>
                    </div>

                    <p className="mt-6 text-xs text-muted-foreground">
                        Nota: después de recibir tu solicitud, el administrador creará la cuenta manualmente y te enviará las credenciales.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

export default Contact
