type AppLogoProps = {
  className?: string;
};

/** Brand mark from `frontend/public/keeper-logo.png` (favicon uses the same asset). */
export function AppLogo({ className = 'h-36 w-auto max-w-[330px] object-contain' }: AppLogoProps) {
  return (
    <img
      src="/keeper-logo.png"
      alt="Keeper"
      className={className}
      decoding="async"
    />
  );
}
