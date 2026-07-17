import type { Business } from "@/data/businesses";

type BusinessAvatarProps = {
  business: Pick<Business, "name" | "initials" | "logo">;
  /** classes de tamanho, formato e cor de fundo do contêiner 1:1 */
  className: string;
  /** classes de tipografia aplicadas às iniciais quando não há logo */
  textClassName?: string;
};

export function BusinessAvatar({ business, className, textClassName }: BusinessAvatarProps) {
  return (
    <div className={`flex aspect-square shrink-0 items-center justify-center overflow-hidden ${className}`}>
      {business.logo ? (
        <img src={business.logo} alt={business.name} className="h-full w-full object-contain" />
      ) : (
        <span className={textClassName}>{business.initials}</span>
      )}
    </div>
  );
}
