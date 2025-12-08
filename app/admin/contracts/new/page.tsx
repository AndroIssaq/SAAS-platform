import { redirect } from "next/navigation"

export default function NewContractRedirect() {
  // Redirect to the new create route
  redirect("/admin/contracts/create")
}
