// /play is no longer the primary hub — redirects to /pills.
// Any bookmarks or old links to /play land here and get sent to Pills.
import { redirect } from "next/navigation";

export default function PlayRedirectPage() {
  redirect("/pills");
}
