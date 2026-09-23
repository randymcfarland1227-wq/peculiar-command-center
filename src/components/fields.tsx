import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

export const controlClass =
  "h-11 w-full border border-line bg-sheet px-3 text-sm text-ink placeholder:text-muted";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs tracking-widest text-muted">{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(controlClass, props.className)} />;
}

export function AreaInput(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn("min-h-24 w-full border border-line bg-sheet px-3 py-2 text-sm text-ink", props.className)}
    />
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(controlClass, props.className)} />;
}

export function PageIntro({
  index,
  kicker,
  title,
  lede,
}: {
  index: string;
  kicker: string;
  title: string;
  lede: string;
}) {
  return (
    <header className="mb-8 border-b border-line pb-6">
      <p className="text-xs tracking-widest text-olive">
        {index}
        <span className="px-2 text-line">/</span>
        {kicker}
      </p>
      <h1 className="mt-2 font-serif text-4xl text-ink md:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">{lede}</p>
    </header>
  );
}

export function SectionTitle({ title, aside }: { title: string; aside?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="font-serif text-2xl text-ink">{title}</h2>
      {aside ? <p className="text-xs tracking-widest text-muted">{aside}</p> : null}
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="border-l-2 border-olive pl-3 text-sm leading-relaxed text-muted">{children}</p>;
}

export function GhostButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn("h-11 border border-line bg-sheet px-4 text-sm text-ink hover:bg-cream", className)}
    >
      {children}
    </button>
  );
}

export function SolidButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn("h-11 bg-forest px-4 text-sm text-paper hover:bg-olive disabled:opacity-40", className)}
    >
      {children}
    </button>
  );
}
