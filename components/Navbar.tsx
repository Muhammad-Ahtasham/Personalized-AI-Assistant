import { checkUser } from "@/lib/checkUser";

export default function Navbar() {
  const user = checkUser();
  return (
    <>
      <nav className="flex justify-between items-center p-4">
        <div>Navbar</div>
      </nav>
    </>
  );
}
