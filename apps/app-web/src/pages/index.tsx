import Link from "next/link";
import { Button } from "ui";

export default function Web() {
  return (
    <div>
      <h1>Welcome</h1>
      <Link href="/create">Create</Link>
    </div>
  );
}
