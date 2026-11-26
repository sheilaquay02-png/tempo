import WorldLabLoader from "../../components/world/WorldLabLoader";

export const metadata = {
  title: "Tempo Town · test lab",
  robots: { index: false, follow: false },
};

export default function WorldLabPage() {
  return <WorldLabLoader />;
}
