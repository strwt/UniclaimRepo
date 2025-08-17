import Logo from "../assets/uniclaim_logo.png";

export default function HeaderComp() {
  return (
    <>
      <div className="flex items-center gap-1">
        <img src={Logo} alt="image_logo" className="size-9" />
        <h1 className="font-albert-sans font-bold text-xl text-blue-950">
          <span className="text-brand">Uni</span>Claim
        </h1>
      </div>
    </>
  );
}
