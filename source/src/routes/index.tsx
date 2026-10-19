import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, ClipboardList, MapPin, ShieldCheck, Lightbulb, Construction, Droplets, Footprints, Building2, Waypoints, Info, CircleHelp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { PublicNav } from "@/components/PublicNav";
import { ResidentSignOut } from "@/components/ResidentSignOut";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/use-auth";
import heroAsset from "@/assets/i-love-bulan.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InfraCare Bulan — Report damaged roads, lights & drainage" },
      { name: "description", content: "InfraCare lets residents of Bulan, Sorsogon report damaged public infrastructure with photos and track repairs from submission to resolution." },
      { property: "og:title", content: "InfraCare Bulan — Community Infrastructure Reporting" },
      { property: "og:description", content: "Help care for Bulan's roads, drainage, streetlights, bridges, sidewalks, and public buildings. Report an issue and follow its progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const cats = [
  { icon: Construction, label: "Roads" },
  { icon: Waypoints, label: "Bridges" },
  { icon: Lightbulb, label: "Streetlights" },
  { icon: Droplets, label: "Drainage & canals" },
  { icon: Footprints, label: "Sidewalks" },
  { icon: Building2, label: "Public buildings" },
];

const features = [
  { icon: Camera, title: "Report with evidence", text: "Describe the problem, mark the location, and attach photos or short videos." },
  { icon: ClipboardList, title: "Track every step", text: "See plain-language updates from Submitted to Resolved, with a dated history." },
  { icon: MapPin, title: "Pinpoint the place", text: "Give an address or landmark so crews find the exact spot." },
  { icon: ShieldCheck, title: "Your details stay private", text: "Only you and authorized staff can see your reports and identity." },
];

function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="public-header mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4">
        <div className="flex min-w-0 items-center gap-1">
          <Logo />
          <ResidentSignOut />
        </div>
        <PublicNav>
          <Button variant="ghost" className="nav-item" asChild><a href="#about"><Info />About</a></Button>
          <Button variant="ghost" className="nav-item" asChild><a href="#help"><CircleHelp />Help</a></Button>
          <Button variant="ghost" className="nav-item" asChild><Link to="/transparency"><BarChart3 />Transparency</Link></Button>
          <Button variant="ghost" className="nav-item" asChild><Link to="/infrastructure"><Building2 />Infrastructure</Link></Button>
        </PublicNav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-10 pt-6 md:grid-cols-2 md:pb-14">
        <div>
          <p className="mb-4 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">For the Municipality of Bulan, Sorsogon</p>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            See something broken in Bulan? <span className="text-primary">Let's fix it together.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            Help care for Bulan's roads, drainage, streetlights, bridges, sidewalks, and public buildings. Report an issue and follow its progress.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" variant="report" asChild><Link to={user ? "/reports/new" : "/auth"} search={user ? undefined : { mode: "signup" }}>Report an issue</Link></Button>
            <Button size="lg" variant="outline" asChild><a href="#about">How it works</a></Button>
          </div>
        </div>
        <img src={heroAsset.url} alt="The I love Bulan photo-op sign: bright letters, sculpted orange fish, and fairy lights hanging in a large tree" width={516} height={387} className="aspect-[4/3] w-full rounded-2xl object-cover shadow-soft" />
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-3 gap-4 px-4 py-8 md:grid-cols-6">
          {cats.map((c) => (
            <div key={c.label} className="category-tile flex flex-col items-center gap-3 text-center text-sm font-medium">
              <span className="category-icon grid h-16 w-16 place-items-center rounded-2xl"><c.icon className="h-8 w-8" strokeWidth={1.8} /></span>
              {c.label}
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-3xl font-semibold md:text-4xl">How InfraCare works</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Residents of Bulan report problems in their barangay. Staff review, prioritize and assign them to the responsible office. Everyone can follow progress until the repair is done.
          InfraCare supports reporting and coordination — it doesn't perform repairs, dispatch emergency services, or handle payments.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6 shadow-soft">
              <f.icon className="h-7 w-7 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="help" className="bg-secondary/60">
        <div className="mx-auto max-w-3xl px-4 py-20">
          <h2 className="text-3xl font-semibold">Help</h2>
          <Accordion type="single" collapsible className="mt-6">
            <AccordionItem value="1"><AccordionTrigger>How do I submit a report?</AccordionTrigger><AccordionContent>Register or sign in, choose "New report", pick the category and severity, describe the problem, choose your barangay in Bulan, and attach up to 5 photos or videos. You can also pin the exact spot on the map.</AccordionContent></AccordionItem>
            <AccordionItem value="2"><AccordionTrigger>Can I change my report?</AccordionTrigger><AccordionContent>Yes — while it is "Submitted" or "Needs more info". You can also withdraw it at those stages.</AccordionContent></AccordionItem>
            <AccordionItem value="3"><AccordionTrigger>Who can see my report?</AccordionTrigger><AccordionContent>Only you and authorized staff. Your name is never shown publicly.</AccordionContent></AccordionItem>
            <AccordionItem value="4"><AccordionTrigger>Which places does InfraCare cover?</AccordionTrigger><AccordionContent>InfraCare covers the whole Municipality of Bulan, Sorsogon — all 64 barangays, from the poblacion to the farthest sitios.</AccordionContent></AccordionItem>
            <AccordionItem value="5"><AccordionTrigger>Is this for emergencies?</AccordionTrigger><AccordionContent>No. If anyone is in immediate danger, contact your local emergency services directly.</AccordionContent></AccordionItem>
          </Accordion>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <Logo />
          <p>© {new Date().getFullYear()} InfraCare. For reporting and tracking only — not an emergency service.</p>
        </div>
      </footer>
    </div>
  );
}
