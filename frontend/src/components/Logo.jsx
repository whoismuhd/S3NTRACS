import React from 'react'
import logoIcon from '../assets/logo-icon.svg'
import logoFull from '../assets/logo.svg'

export function LogoIcon({ className = "h-10" }) {
  return (
    <img 
      src={logoIcon} 
      alt="S3ntraCS" 
      className={`${className} transition-all hover:opacity-90`}
      style={{ imageRendering: 'crisp-edges' }}
    />
  )
}

export function LogoFull({ className = "h-10" }) {
  return (
    <img 
      src={logoFull} 
      alt="S3ntraCS - Cloud Security Posture Management" 
      className={`${className} transition-all hover:opacity-90 mx-auto`}
      style={{ imageRendering: 'crisp-edges' }}
    />
  )
}

export default function Logo({ variant = "full", className }) {
  if (variant === "icon") {
    return <LogoIcon className={className} />
  }
  return <LogoFull className={className} />
}

