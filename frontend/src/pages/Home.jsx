import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const FEATURES = [
  { id: '1', title: 'Universal Ingestion',  desc: 'API, Web portal, and custom CSV uploads with raw archival for full lineage.' },
  { id: '2', title: 'Unify & Clean',        desc: 'Dynamic schema alignment, statistical normalization, and smart handling of outliers.' },
  { id: '3', title: '7-D QA Engine',        desc: 'Completeness, Accuracy, Validity, Consistency, Uniqueness, Integrity, and Lineage scored in one pass.' },
  { id: '4', title: 'Dashboard & Export',   desc: 'Run new analysis on any dataset, view trustability scores, and download reports.' },
];

const DIMENSIONS = [
  { name: 'Completeness', icon: '✓', desc: 'No missing fields; coverage across required attributes.' },
  { name: 'Accuracy',     icon: '◎', desc: 'Values match real-world facts and reference data.' },
  { name: 'Validity',     icon: '◇', desc: 'Format and rules compliance (dates, numbers, enums).' },
  { name: 'Consistency',  icon: '≡', desc: 'Aligned across sources and time with no contradictions.' },
  { name: 'Uniqueness',   icon: '1', desc: 'No unintended duplicates; clear entity resolution.' },
  { name: 'Integrity',    icon: '⟷', desc: 'Referential and structural relationships hold.' },
  { name: 'Lineage',      icon: '→', desc: 'Full traceability from source to output.' },
];


function BgBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-background">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] mix-blend-multiply opacity-50 dark:opacity-20 animate-in fade-in duration-1000" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[150px] mix-blend-multiply opacity-50 dark:opacity-20 animate-in fade-in duration-1000 delay-500" />
    </div>
  );
}

function SectionHeading({ title, subtitle, barClass = 'w-12 h-0.5' }) {
  return (
    <>
      <h2 className="text-4xl md:text-5xl font-serif font-medium text-foreground mb-6">{title}</h2>
      <div className={`${barClass} bg-primary opacity-80 mb-8`} />
      {subtitle && (
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">{subtitle}</p>
      )}
    </>
  );
}


export default function Home() {
  return (
    <div className="flex flex-col min-h-screen relative font-sans">
      <BgBlobs />

      <main className="flex-1 flex flex-col">

        {/* Hero */}
        <section className="relative px-4 pt-24 pb-32 md:pt-40 md:pb-48 container mx-auto text-center flex flex-col items-center">
          <p className="text-sm font-semibold tracking-widest text-muted-foreground uppercase mb-6 animate-in slide-in-from-bottom-4 fade-in duration-700">
            Data Quality & Trustability
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-foreground font-medium tracking-tight leading-tight mb-8 animate-in slide-in-from-bottom-6 fade-in duration-700 delay-100 max-w-5xl mx-auto">
            One Framework<br />
            <span className="text-primary dark:text-muted-foreground italic">Seven Dimensions</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed animate-in slide-in-from-bottom-6 fade-in duration-700 delay-200">
            Ingest, unify, and remediate any dataset with a rigorous quality engine built for reliable AI and analytics.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 animate-in slide-in-from-bottom-6 fade-in duration-700 delay-300 w-full sm:w-auto">
            <Button size="lg" asChild className="h-14 px-8 text-base shadow-sm w-full sm:w-auto rounded-full bg-gold text-gold-foreground hover:bg-gold/80 hover:scale-[1.02] transition-all duration-300">
              <Link to="/dashboard">Open Dashboard</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground font-medium tracking-wide mb-16 animate-in fade-in duration-700 delay-500">
            Run analysis &middot; View scores &middot; Export PDF
          </p>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="pt-10 pb-24 md:pt-10 md:pb-24 bg-background border-y border-border/50">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mb-20 md:mb-28 pl-4 md:pl-8">
              <SectionHeading
                title="How it works"
                subtitle="A unified pipeline to bring trustability to your data workflows."
                barClass="w-12 h-0.5 mt-8 md:mt-16"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-20 lg:gap-x-24 max-w-5xl mx-auto mt-12">
              {FEATURES.map((f) => (
                <div key={f.id} className="relative flex items-start group pl-8 md:pl-16">
                  <div className="absolute left-0 -top-8 md:-top-12 text-[140px] leading-none font-serif italic text-foreground/80 dark:text-foreground/80 select-none pointer-events-none z-0">
                    {f.id}
                  </div>
                  <div className="relative z-10 pl-1 ml-12 md:ml-10 border-l border-border/40 group-hover:border-primary/30 transition-colors duration-300">
                    <h3 className="text-xl md:text-2xl font-serif font-medium mb-4 text-foreground">{f.title}</h3>
                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Seven Dimensions */}
        <section className="py-24 md:py-32 container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mb-16 md:mb-24">
            <SectionHeading
              title="The seven dimensions"
              subtitle="Each dimension is scored in a single pass so you get a complete trustability picture."
              barClass="w-16 h-1 rounded-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {DIMENSIONS.map((d) => (
              <Card key={d.name} className="flex flex-col h-full bg-background border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                <CardHeader className="flex-1">
                  <div className="text-4xl mb-6 text-muted-foreground group-hover:text-primary transition-colors font-serif italic">{d.icon}</div>
                  <CardTitle className="text-xl tracking-tight">{d.name}</CardTitle>
                  <CardDescription className="text-base leading-relaxed mt-3">{d.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}