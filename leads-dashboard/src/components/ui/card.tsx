'use client';

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'shadow' | 'bordered' | 'flat';
  isHoverable?: boolean;
  isPressable?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Card({
  variant = 'shadow',
  isHoverable = false,
  isPressable = false,
  className = '',
  children,
  ...props
}: CardProps) {
  const variantStyles =
    variant === 'bordered'
      ? 'border border-theme-border bg-theme-card'
      : variant === 'flat'
      ? 'bg-theme-card/60 border border-white/5'
      : 'glass-panel shadow-xl';

  const hoverStyle = isHoverable
    ? 'hover:-translate-y-1 hover:shadow-2xl hover:border-accent/30 transition-all duration-200'
    : '';

  const pressStyle = isPressable
    ? 'cursor-pointer active:scale-[0.98] transition-transform duration-100'
    : '';

  return (
    <div
      className={`rounded-3xl overflow-hidden ${variantStyles} ${hoverStyle} ${pressStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export function CardHeader({ className = '', children, ...props }: CardHeaderProps) {
  return (
    <div className={`p-5 md:p-6 pb-3 flex items-center justify-between gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
}

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export function CardBody({ className = '', children, ...props }: CardBodyProps) {
  return (
    <div className={`p-5 md:p-6 pt-2 flex-1 ${className}`} {...props}>
      {children}
    </div>
  );
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export function CardFooter({ className = '', children, ...props }: CardFooterProps) {
  return (
    <div className={`p-4 md:p-6 pt-3 border-t border-theme-border/20 flex items-center justify-between gap-3 bg-white/[0.02] ${className}`} {...props}>
      {children}
    </div>
  );
}

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
