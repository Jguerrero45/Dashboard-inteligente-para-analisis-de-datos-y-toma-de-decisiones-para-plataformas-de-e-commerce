import * as React from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
    toggleLabel?: boolean
}

export default function PasswordInput({ className, toggleLabel = true, ...props }: Props) {
    const [show, setShow] = React.useState(false)
    return (
        <div className={cn('relative', className)}>
            <Input {...props} type={show ? 'text' : 'password'} className="pr-20" />
            <button
                type="button"
                onClick={() => setShow(s => !s)}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded px-3 py-1 text-sm text-muted-foreground hover:bg-muted/50"
                aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
                {toggleLabel ? (show ? 'Ocultar' : 'Mostrar') : (show ? '🙈' : '👁️')}
            </button>
        </div>
    )
}
