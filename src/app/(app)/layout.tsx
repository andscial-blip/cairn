import { AppProvider } from "@/lib/app-context";
import { Shell } from "@/components/shell";
import { AuthForward } from "../auth-forward";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppProvider><AuthForward /><Shell>{children}</Shell></AppProvider>;
}
