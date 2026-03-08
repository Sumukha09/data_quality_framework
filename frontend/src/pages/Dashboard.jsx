import { useState, useEffect } from "react";
import { downloadPropertiesPdf } from "../pdfExport";
import { sendAnalysisIdEmail } from "../api";
import { downloadCleanedDataXlsx } from "../lib/downloadCleanedDataXlsx";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FileUp,
  ArrowRight,
  Download,
  Activity,
  ExternalLink,
  Calendar as CalendarIcon,
  FileText,
  Copy,
  Search,
  Lock,
  Clock,
  X,
  Mail,
  Check,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

import { useDashboard } from "../hooks/useDashboard";
import { INGESTION_METHODS } from "../services/dashboardService";

function StatBlock({ label, value, description, isFail }) {
  return (
    <div
      className={`card-stat group ${isFail ? "ring-2 ring-destructive/40" : ""}`}
    >
      <div>
        <p className="text-xs tracking-widest uppercase font-semibold text-[var(--stat-card-foreground)] opacity-70 mb-2">
          {label}
        </p>
        <div className="text-4xl md:text-5xl font-serif tracking-tight mb-3 text-[var(--stat-card-foreground)] transition-transform duration-500 group-hover:-translate-y-1">
          {value}
        </div>
      </div>
      {description && (
        <p className="text-sm text-[var(--stat-card-foreground)] opacity-90 leading-relaxed max-w-sm">
          {description}
        </p>
      )}
    </div>
  );
}

function DatePicker({ label, value, onChange, disabled }) {
  return (
    <div className="space-y-3 flex flex-col">
      <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
        {label}
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={`btn-outline w-full ${!value && "text-muted-foreground"}`}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground opacity-80 dark:text-foreground" />
            {value ? (
              format(value, "PPP")
            ) : (
              <span className="text-muted-foreground opacity-80">
                Pick a date
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            initialFocus
            className="rounded-lg border border-border"
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function EmptyState({ title, message }) {
  return (
    <div className="container mx-auto px-6 py-24 text-center">
      <h2 className="text-6xl font-serif italic text-muted-foreground/30 mb-6">
        {title}
      </h2>
      <p className="text-xl text-muted-foreground max-w-md mx-auto">
        {message}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const {
    report,
    rawReport,
    cleanedReport,
    rawData,
    cleanedData,
    reportUrl,
    edaUrl,
    rawEdaUrl,
    analysisId,
    processing,
    error,
    executeAnalysis,
    resetDashboard,
    loadRemoteAnalysis,
    retrievedRecord,
  } = useDashboard();

  const [sourceType, setSourceType] = useState("upload");
  const [sourceUrl, setSourceUrl] = useState("");
  const [useDateRange, setUseDateRange] = useState(false);
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [apiInputMode, setApiInputMode] = useState("link");
  const [apiKey, setApiKey] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [searchId, setSearchId] = useState("");
  const [edaViewerUrl, setEdaViewerUrl] = useState(null);
  const [edaViewerTitle, setEdaViewerTitle] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [emailError, setEmailError] = useState("");

  const isUpload = sourceType === "upload";

  useEffect(() => {
    resetDashboard();
  }, [resetDashboard]);

  const handleRetrieve = async (e) => {
    if (e) e.preventDefault();
    if (!searchId.trim()) return;
    try {
      await loadRemoteAnalysis(searchId);
    } catch (err) {
      // Error handled by hook
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleSendEmail = async (idToSend) => {
    if (!emailAddress.trim()) return;
    setEmailSending(true);
    setEmailStatus(null);
    setEmailError("");
    try {
      await sendAnalysisIdEmail(emailAddress.trim(), idToSend);
      setEmailStatus("sent");
      setTimeout(() => { setShowEmailInput(false); setEmailStatus(null); setEmailAddress(""); }, 3000);
    } catch (err) {
      setEmailStatus("error");
      setEmailError(err.message || "Failed to send email");
    } finally {
      setEmailSending(false);
    }
  };

  const isFormValid = () => {
    if (isUpload) return !!selectedFile;
    const hasUrl = sourceUrl.trim().length > 0;
    const hasKey =
      sourceType === "api" && apiInputMode === "key"
        ? apiKey.trim().length > 0
        : true;
    return useDateRange
      ? hasUrl && hasKey && startDate && endDate
      : hasUrl && hasKey;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    await executeAnalysis({
      sourceType,
      sourceUrl,
      useDateRange,
      startDate,
      endDate,
      apiInputMode,
      apiKey,
      selectedFile,
    });
  };

  const rawTableKeys =
    rawData.length > 0 && typeof rawData[0] === "object"
      ? Object.keys(rawData[0])
      : [];
  const cleanedTableKeys =
    cleanedData.length > 0 && typeof cleanedData[0] === "object"
      ? Object.keys(cleanedData[0])
      : [];
  const isNoData = report?.status === "No Data Found for this period";
  const showResults = report && !report.error && !isNoData;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col selection:bg-primary/20">
      {/* ── Form ── */}
      <main className="flex-1 container mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
          {/* Left — sticky header + submit */}
          <div className="lg:col-span-5 lg:sticky lg:top-32 space-y-10">
            <div>
              <h1 className="text-5xl md:text-7xl font-serif font-medium tracking-tight leading-[1.1] mb-8">
                Run Quality <br />
                <span className="italic text-muted-foreground">Analysis.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-md">
                Configure your data pipeline ingestion source. We will extract,
                normalize, and score your dataset against the 7-dimensional
                trust framework.
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={processing || !isFormValid()}
              className={`group w-full md:w-auto md:min-w-[300px] px-8 py-6 text-lg flex items-center gap-3 rounded-full
                ${
                  processing || !isFormValid()
                    ? "bg-secondary text-muted-foreground cursor-not-allowed border border-border"
                    : "btn-gold"
                }`}
            >
              <span>
                {processing ? "Processing Dataset..." : "Execute Pipeline"}
              </span>
              {processing ? (
                <Activity className="w-6 h-6 animate-spin opacity-70" />
              ) : (
                <ArrowRight className="w-6 h-6 transform group-hover:translate-x-2 transition-transform" />
              )}
            </button>

            {error && (
              <p className="text-destructive font-medium bg-destructive/5 px-6 py-4 rounded-xl border border-destructive/20 animate-in fade-in">
                {error}
              </p>
            )}
          </div>

          {/* Right — form steps */}
          <div className="lg:col-span-7 space-y-20 pt-8 lg:pt-0">
            {/* Step 01 — Ingestion method */}
            <div className="space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-700">
              <h3 className="text-2xl font-serif">
                01. Select Ingestion Method
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {INGESTION_METHODS.map(({ id, icon: Icon, label, desc }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSourceType(id)}
                    className={`flex flex-col items-start p-6 rounded-3xl border transition-all duration-300 text-left
                      ${
                        sourceType === id
                          ? "border-foreground bg-foreground/5 shadow-inner"
                          : "border-border/60 hover:border-foreground/30 hover:bg-secondary/20"
                      }`}
                  >
                    <Icon
                      className={`w-6 h-6 mb-4 ${sourceType === id ? "text-foreground" : "text-muted-foreground"}`}
                    />
                    <span className="font-semibold text-lg mb-1">{label}</span>
                    <span className="text-sm text-muted-foreground">
                      {desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 02 — Configure source */}
            <div className="space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-150">
              <h3 className="text-2xl font-serif">02. Configure Source</h3>

              {isUpload ? (
                <div className="relative group rounded-2xl border-2 border-dashed border-border/60 hover:border-gold/60 bg-secondary/10 hover:bg-secondary/20 transition-all duration-300 w-full max-w-lg overflow-hidden">
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center">
                    <div
                      className={`h-12 w-12 rounded-full ${selectedFile ? "bg-gold/20" : "bg-primary/10"} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500`}
                    >
                      {selectedFile ? (
                        <FileText className="h-6 w-6 text-gold" />
                      ) : (
                        <FileUp className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      {selectedFile
                        ? selectedFile.name
                        : "Click to upload dataset"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedFile
                        ? "Ready for processing"
                        : "CSV, JSON, PDF files supported"}
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept=".csv,.json,.xml,.pdf,.xlsx,.xls,.txt"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    disabled={processing}
                    className="opacity-0 w-full h-40 cursor-pointer"
                  />
                </div>
              ) : (
                <div className="space-y-12">
                  <div>
                    <Label className="form-label">Target URL</Label>
                    <Input
                      type="url"
                      placeholder={
                        sourceType === "api"
                          ? "https://api.example.com/v1/data"
                          : "https://example.com/portal"
                      }
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      disabled={processing}
                      className="input-field max-w-lg"
                    />
                  </div>

                  {sourceType === "api" && (
                    <div className="space-y-6">
                      <Label className="form-label">
                        Security Authorization
                      </Label>
                      <RadioGroup
                        value={apiInputMode}
                        onValueChange={setApiInputMode}
                        disabled={processing}
                        className="flex gap-8"
                      >
                        {[
                          { value: "link", label: "Public Endpoint" },
                          {
                            value: "key",
                            label: "Secured Endpoint (Key required)",
                          },
                        ].map(({ value, label }) => (
                          <div
                            key={value}
                            className="flex items-center space-x-3"
                          >
                            <RadioGroupItem
                              value={value}
                              id={`api-${value}`}
                              className="w-5 h-5 border-2"
                            />
                            <Label
                              htmlFor={`api-${value}`}
                              className="text-base cursor-pointer"
                            >
                              {label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>

                      {apiInputMode === "key" && (
                        <div className="mt-6 space-y-2 animate-in fade-in zoom-in-95">
                          <Label className="text-sm font-medium text-muted-foreground">
                            API Key / Bearer Token
                          </Label>
                          <Input
                            type="password"
                            placeholder="Enter your API key or token here"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            disabled={processing}
                            className="input-field font-mono max-w-lg"
                          />
                          <p className="text-xs text-muted-foreground">
                            Key will be sent as Authorization header and
                            x-api-key
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 03 — Timeframe (non-upload only) */}
            {!isUpload && (
              <div className="space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300">
                <div className="flex flex-col space-y-4">
                  <Label
                    htmlFor="date_range"
                    className="text-2xl font-serif cursor-pointer"
                  >
                    03. Timeframe Filter
                  </Label>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="date_range"
                      checked={useDateRange}
                      onCheckedChange={setUseDateRange}
                      disabled={processing}
                      className="w-5 h-5 border-2 border-primary rounded-full data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                    <Label
                      htmlFor="date_range"
                      className="form-label mb-0 cursor-pointer"
                    >
                      Enable Date Range Filtering
                    </Label>
                  </div>
                </div>

                {useDateRange && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pl-10 border-l-2 border-border/40 mt-8">
                    <DatePicker
                      label="Period Start"
                      value={startDate}
                      onChange={setStartDate}
                      disabled={processing}
                    />
                    <DatePicker
                      label="Period End"
                      value={endDate}
                      onChange={setEndDate}
                      disabled={processing}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Results ── */}
      {showResults && (
        <section className="border-t border-border mt-12 bg-secondary/10 animate-in fade-in slide-in-from-bottom-16 duration-1000">
          <div className="container mx-auto px-6 py-24 md:py-32">
            {/* Quality Scores - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
              {/* Raw Data Quality Score */}
              {rawReport && (
                <div className="p-8 rounded-3xl border border-border/50 bg-background/50">
                  <Badge
                    variant="outline"
                    className="mb-6 bg-amber-600/20 text-amber-400 px-4 py-1.5 text-xs tracking-widest uppercase rounded-full border-amber-600/30"
                  >
                    Raw Data Quality
                  </Badge>
                  <h2 className="text-4xl md:text-6xl font-serif italic tracking-tight mb-4 text-foreground">
                    Score: {Math.round(rawReport.overall_trustability)}
                  </h2>
                  <p className="text-lg text-muted-foreground font-serif mb-2">
                    Out of 100 possible points.
                  </p>
                  <p className="text-2xl font-serif text-foreground">
                    {rawReport.total_records}{" "}
                    <span className="text-sm text-muted-foreground uppercase tracking-wider">
                      Records
                    </span>
                  </p>

                  {/* Raw Dimensions */}
                  <div className="grid grid-cols-2 gap-3 mt-8">
                    {rawReport.dimensions &&
                      Object.entries(rawReport.dimensions).map(
                        ([name, data]) => {
                          const score =
                            typeof data === "number" ? data : data?.score || 0;
                          const isFail = score < 70;
                          return (
                            <div
                              key={name}
                              className={`p-3 rounded-xl ${isFail ? "bg-destructive/10 border border-destructive/30" : "bg-secondary/30"}`}
                            >
                              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                                {name}
                              </p>
                              <p
                                className={`text-xl font-bold ${isFail ? "text-destructive" : "text-foreground"}`}
                              >
                                {Math.round(score)}%
                              </p>
                            </div>
                          );
                        },
                      )}
                  </div>
                </div>
              )}

              {/* Cleaned Data Quality Score */}
              {cleanedReport && (
                <div className="p-8 rounded-3xl border border-border/50 bg-background/50">
                  <Badge
                    variant="outline"
                    className="mb-6 bg-emerald-600/20 text-emerald-400 px-4 py-1.5 text-xs tracking-widest uppercase rounded-full border-emerald-600/30"
                  >
                    Cleaned Data Quality
                  </Badge>
                  <h2 className="text-4xl md:text-6xl font-serif italic tracking-tight mb-4 text-foreground">
                    Score: {Math.round(cleanedReport.overall_trustability)}
                  </h2>
                  <p className="text-lg text-muted-foreground font-serif mb-2">
                    Out of 100 possible points.
                  </p>
                  <p className="text-2xl font-serif text-foreground">
                    {cleanedReport.total_records}{" "}
                    <span className="text-sm text-muted-foreground uppercase tracking-wider">
                      Records
                    </span>
                  </p>

                  {/* Cleaned Dimensions */}
                  <div className="grid grid-cols-2 gap-3 mt-8">
                    {cleanedReport.dimensions &&
                      Object.entries(cleanedReport.dimensions).map(
                        ([name, data]) => {
                          const score =
                            typeof data === "number" ? data : data?.score || 0;
                          const isFail = score < 70;
                          return (
                            <div
                              key={name}
                              className={`p-3 rounded-xl ${isFail ? "bg-destructive/10 border border-destructive/30" : "bg-secondary/30"}`}
                            >
                              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                                {name}
                              </p>
                              <p
                                className={`text-xl font-bold ${isFail ? "text-destructive" : "text-foreground"}`}
                              >
                                {Math.round(score)}%
                              </p>
                            </div>
                          );
                        },
                      )}
                  </div>
                </div>
              )}
            </div>

            {/* Data Tables - Full Width */}
            {(rawTableKeys.length > 0 || cleanedTableKeys.length > 0) && (
              <div className="mt-32 space-y-16">
                {/* Raw data table */}
                {rawTableKeys.length > 0 && (
                  <div className="w-full">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                      <div>
                        <h3 className="text-3xl md:text-4xl font-serif tracking-tight mb-3">
                          Raw Data
                        </h3>
                        <p className="text-lg text-muted-foreground">
                          Original ingested data before cleaning and
                          remediation.
                        </p>
                      </div>
                      <div className="flex gap-4">
                        <button
                          onClick={() =>
                            window.open("/api/eda-profile-raw", "_blank")
                          }
                          className="flex items-center gap-2 text-sm font-semibold tracking-wide uppercase hover:text-primary transition-colors"
                        >
                          <span>EDA Profile</span>
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="border border-border/50 rounded-2xl overflow-hidden bg-background">
                      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <Table className="w-full min-w-max">
                          <TableHeader className="bg-secondary/30 sticky top-0 z-10">
                            <TableRow className="border-border/50 hover:bg-transparent">
                              {rawTableKeys.map((key) => (
                                <TableHead
                                  key={key}
                                  className="font-semibold text-foreground whitespace-nowrap px-6 py-4 h-auto text-sm uppercase tracking-widest"
                                >
                                  {key.replace(/_/g, " ")}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rawData.map((row, i) => (
                              <TableRow
                                key={i}
                                className="border-border/50 hover:bg-secondary/20 transition-colors"
                              >
                                {rawTableKeys.map((key) => (
                                  <TableCell
                                    key={key}
                                    className="font-mono text-base px-6 py-4 whitespace-nowrap text-muted-foreground"
                                  >
                                    {row[key] != null ? String(row[key]) : "—"}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cleaned data table */}
                {cleanedTableKeys.length > 0 && (
                  <div className="w-full">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                      <div>
                        <h3 className="text-3xl md:text-4xl font-serif tracking-tight mb-3">
                          Cleaned Data
                        </h3>
                        <p className="text-lg text-muted-foreground">
                          Processed data after remediation and quality
                          improvements.
                        </p>
                      </div>
                      <div className="flex gap-4">
                        <button
                          onClick={() =>
                            window.open("/api/eda-profile", "_blank")
                          }
                          className="flex items-center gap-2 text-sm font-semibold tracking-wide uppercase hover:text-primary transition-colors"
                        >
                          <span>EDA Profile</span>
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadCleanedDataXlsx(cleanedData)}
                          className="flex items-center gap-2 text-sm font-semibold tracking-wide uppercase hover:text-primary transition-colors"
                        >
                          <span>Download XLSX</span>
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="border border-border/50 rounded-2xl overflow-hidden bg-background">
                      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <Table className="w-full min-w-max">
                          <TableHeader className="bg-secondary/30 sticky top-0 z-10">
                            <TableRow className="border-border/50 hover:bg-transparent">
                              {cleanedTableKeys.map((key) => (
                                <TableHead
                                  key={key}
                                  className="font-semibold text-foreground whitespace-nowrap px-6 py-4 h-auto text-sm uppercase tracking-widest"
                                >
                                  {key.replace(/_/g, " ")}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {cleanedData.map((row, i) => (
                              <TableRow
                                key={i}
                                className="border-border/50 hover:bg-secondary/20 transition-colors"
                              >
                                {cleanedTableKeys.map((key) => (
                                  <TableCell
                                    key={key}
                                    className="font-mono text-base px-6 py-4 whitespace-nowrap text-muted-foreground"
                                  >
                                    {row[key] != null ? String(row[key]) : "—"}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    {/* Big Download Quality Check Report button below table */}
                    <div className="flex justify-center mt-10 mb-16">
                      <button
                        onClick={() =>
                          downloadPropertiesPdf(
                            cleanedData,
                            cleanedReport || report,
                            rawData,
                            rawReport,
                          )
                        }
                        className="w-full max-w-xl px-8 py-6 text-2xl font-bold rounded-2xl bg-gold text-background flex items-center justify-center gap-4 shadow-lg hover:bg-amber-500 transition-all border-2 border-gold uppercase tracking-widest"
                      >
                        <Download className="w-8 h-8 mr-2" />
                        Download Quality Check Report
                      </button>
                    </div>

                    <div className="flex flex-col items-center gap-4 mt-10 mb-16">
                        <div className="flex gap-4 w-full max-w-xl">
                          {edaUrl && (
                            <button
                              onClick={() => { setEdaViewerUrl(edaUrl); setEdaViewerTitle("EDA Profile (Cleaned)"); }}
                              className="flex-1 px-4 py-4 text-lg font-bold rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center gap-2 shadow-md hover:bg-secondary/80 transition-all border-2 border-secondary uppercase tracking-tight cursor-pointer"
                            >
                              <Activity className="w-5 h-5" />
                              Cleaned EDA
                            </button>
                          )}
                          {rawEdaUrl && (
                            <button
                              onClick={() => { setEdaViewerUrl(rawEdaUrl); setEdaViewerTitle("EDA Profile (Raw)"); }}
                              className="flex-1 px-4 py-4 text-lg font-bold rounded-xl bg-muted text-muted-foreground flex items-center justify-center gap-2 shadow-md hover:bg-muted/80 transition-all border-2 border-muted uppercase tracking-tight cursor-pointer"
                            >
                              <Activity className="w-5 h-5" />
                              Raw EDA
                            </button>
                          )}
                        </div>
                        
                        {analysisId && (
                            <div className="mt-8 p-6 bg-primary/5 rounded-3xl border-2 border-primary/20 flex flex-col items-center gap-4 w-full max-w-xl">
                                <div className="text-center w-full">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <Lock className="w-4 h-4 text-primary" />
                                        <p className="text-xs uppercase tracking-[0.2em] font-black text-primary">Private Analysis ID</p>
                                    </div>
                                    <p className="text-xl font-mono font-bold text-foreground break-all bg-background/50 p-4 rounded-xl border border-border/50 select-all">{analysisId}</p>
                                    <p className="text-[10px] text-muted-foreground mt-3 uppercase tracking-widest font-bold">Copy or email this ID to retrieve your report later. Valid for 7 days.</p>
                                </div>
                                <Button 
                                    variant="outline" 
                                    onClick={() => copyToClipboard(analysisId)}
                                    className="w-full h-12 rounded-xl flex items-center justify-center gap-3 hover:bg-primary hover:text-primary-foreground transition-all duration-300 group"
                                >
                                    <Copy className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
                                    <span className="font-bold uppercase tracking-widest">Copy Analysis ID</span>
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => { setShowEmailInput(!showEmailInput); setEmailStatus(null); setEmailError(""); }}
                                    className="w-full h-12 rounded-xl flex items-center justify-center gap-3 hover:bg-primary hover:text-primary-foreground transition-all duration-300 group"
                                >
                                    <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
                                    <span className="font-bold uppercase tracking-widest">Email Analysis ID</span>
                                </Button>
                                {showEmailInput && (
                                    <div className="w-full mt-2 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <div className="flex gap-2">
                                            <Input
                                                type="email"
                                                placeholder="Enter your email address"
                                                value={emailAddress}
                                                onChange={(e) => setEmailAddress(e.target.value)}
                                                className="flex-1 h-12 rounded-xl"
                                                disabled={emailSending}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSendEmail(analysisId)}
                                            />
                                            <Button
                                                onClick={() => handleSendEmail(analysisId)}
                                                disabled={emailSending || !emailAddress.trim()}
                                                className="h-12 rounded-xl px-6 font-bold uppercase tracking-widest"
                                            >
                                                {emailSending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
                                            </Button>
                                        </div>
                                        {emailStatus === 'sent' && (
                                            <p className="text-emerald-500 text-sm font-bold mt-2 flex items-center justify-center gap-2">
                                                <Check className="w-4 h-4" /> Analysis ID sent to your email!
                                            </p>
                                        )}
                                        {emailStatus === 'error' && (
                                            <p className="text-destructive text-sm font-bold mt-2">⚠️ {emailError}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                      </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {isNoData && (
        <EmptyState
          title="Zero Results"
          message="No records were ingested. Ensure the target source has data or expand the requested time frame."
        />
      )}

      {/* Retrieved Record Display */}
      {retrievedRecord && (
        <section className="border-t border-border mt-12 bg-secondary/10 animate-in fade-in slide-in-from-bottom-16 duration-1000">
          <div className="container mx-auto px-6 py-24 md:py-32">
            <div className="max-w-3xl mx-auto text-center">
              <Badge
                variant="outline"
                className="mb-6 bg-emerald-600/20 text-emerald-400 px-4 py-1.5 text-xs tracking-widest uppercase rounded-full border-emerald-600/30"
              >
                Retrieved Successfully
              </Badge>
              <h2 className="text-4xl md:text-6xl font-serif italic tracking-tight mb-4 text-foreground">
                {retrievedRecord.file_name}
              </h2>
              <p className="text-lg text-muted-foreground font-serif mb-8">
                {(() => {
                  const mime = retrievedRecord.file_type || "";
                  const map = {
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
                    "application/vnd.ms-excel": "XLS",
                    "text/csv": "CSV",
                    "application/json": "JSON",
                    "application/pdf": "PDF",
                    "text/plain": "TXT",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
                  };
                  return map[mime.toLowerCase()] || mime.split("/").pop()?.toUpperCase() || retrievedRecord.file_name?.split(".").pop()?.toUpperCase() || "FILE";
                })()} · {(() => {
                  const src = retrievedRecord.source || "";
                  const sourceMap = {
                    "others_upload": "File Upload",
                    "xlsx_upload": "XLSX Upload",
                    "json_upload": "JSON Upload",
                    "parquet_upload": "Parquet Upload",
                    "api": "API Ingestion",
                    "link": "URL Ingestion",
                    "upload": "File Upload"
                  };
                  return sourceMap[src.toLowerCase()] || src.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                })()} · Uploaded {new Date(retrievedRecord.upload_date).toLocaleDateString()}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
                {reportUrl && (
                  <a
                    href={reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-3 p-6 rounded-2xl border border-border/50 bg-background/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                  >
                    <FileText className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-widest">Quality Report PDF</span>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>
                )}
                {edaUrl && (
                  <button
                    onClick={() => { setEdaViewerUrl(edaUrl); setEdaViewerTitle("EDA Profile (Cleaned)"); }}
                    className="group flex flex-col items-center gap-3 p-6 rounded-2xl border border-border/50 bg-background/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer"
                  >
                    <Activity className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-widest">EDA Profile (Cleaned)</span>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
                {rawEdaUrl && (
                  <button
                    onClick={() => { setEdaViewerUrl(rawEdaUrl); setEdaViewerTitle("EDA Profile (Raw)"); }}
                    className="group flex flex-col items-center gap-3 p-6 rounded-2xl border border-border/50 bg-background/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer"
                  >
                    <Activity className="w-8 h-8 text-amber-500 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-widest">EDA Profile (Raw)</span>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              {analysisId && (
                <div className="p-6 bg-primary/5 rounded-3xl border-2 border-primary/20 flex flex-col items-center gap-4 w-full max-w-xl mx-auto mt-12 animate-in fade-in zoom-in duration-500 shadow-xl">
                  <div className="text-center w-full">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Lock className="w-4 h-4 text-primary" />
                      <p className="text-xs uppercase tracking-[0.2em] font-black text-primary">Analysis ID</p>
                    </div>
                    <p className="text-xl font-mono font-bold text-foreground break-all bg-background/50 p-4 rounded-xl border border-border/50 select-all">{analysisId}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(analysisId)}
                    className="w-full h-12 rounded-xl flex items-center justify-center gap-3 hover:bg-primary hover:text-primary-foreground transition-all duration-300 group"
                  >
                    <Copy className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-bold uppercase tracking-widest">Copy Analysis ID</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setShowEmailInput(!showEmailInput); setEmailStatus(null); setEmailError(""); }}
                    className="w-full h-12 rounded-xl flex items-center justify-center gap-3 hover:bg-primary hover:text-primary-foreground transition-all duration-300 group"
                  >
                    <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-bold uppercase tracking-widest">Email Analysis ID</span>
                  </Button>
                  {showEmailInput && (
                    <div className="w-full mt-2 animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="Enter your email address"
                          value={emailAddress}
                          onChange={(e) => setEmailAddress(e.target.value)}
                          className="flex-1 h-12 rounded-xl"
                          disabled={emailSending}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendEmail(analysisId)}
                        />
                        <Button
                          onClick={() => handleSendEmail(analysisId)}
                          disabled={emailSending || !emailAddress.trim()}
                          className="h-12 rounded-xl px-6 font-bold uppercase tracking-widest"
                        >
                          {emailSending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
                        </Button>
                      </div>
                      {emailStatus === 'sent' && (
                        <p className="text-emerald-500 text-sm font-bold mt-2 flex items-center justify-center gap-2">
                          <Check className="w-4 h-4" /> Analysis ID sent to your email!
                        </p>
                      )}
                      {emailStatus === 'error' && (
                        <p className="text-destructive text-sm font-bold mt-2">⚠️ {emailError}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!reportUrl && !edaUrl && !rawEdaUrl && (
                <p className="text-muted-foreground mt-8 text-lg">No cloud artifacts available for this analysis.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Private Retrieval Section */}
      <section className="bg-muted/30 py-24 border-t border-border">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <div className="mb-12">
            <h2 className="text-4xl font-serif mb-4 flex items-center justify-center gap-3">
                <Lock className="w-8 h-8 text-primary" />
                Private Report Retrieval
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Enter your unique Analysis ID to retrieve your persistent cloud reports. 
              <span className="block mt-2 font-bold text-primary flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" /> Reports are automatically purged after 7 days for your privacy.
              </span>
            </p>
          </div>

          <form onSubmit={handleRetrieve} className="flex gap-4 max-w-2xl mx-auto bg-background p-2 rounded-2xl border border-border shadow-sm">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                    placeholder="Paste your Analysis ID here..." 
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    className="border-none bg-transparent pl-11 h-12 focus-visible:ring-0 text-primary font-mono text-sm"
                />
            </div>
            <Button 
                type="submit" 
                disabled={processing || !searchId.trim()}
                className="rounded-xl h-12 px-8 font-bold uppercase tracking-widest"
            >
                {processing ? "Retrieving..." : "Retrieve"}
            </Button>
          </form>
          
          {error && (
              <p className="mt-6 text-destructive font-bold text-sm bg-destructive/5 py-4 rounded-xl border border-destructive/10 inline-block px-8">
                  ⚠️ {error}
              </p>
          )}
        </div>
      </section>

      {/* EDA Profile Iframe Viewer Modal */}
      {edaViewerUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col animate-in fade-in duration-300">
          <div className="flex items-center justify-between px-6 py-4 bg-background/95 border-b border-border shadow-lg">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold uppercase tracking-widest">{edaViewerTitle}</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setEdaViewerUrl(null); setEdaViewerTitle(""); }}
              className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <iframe
              src={`/api/eda-viewer?url=${encodeURIComponent(edaViewerUrl)}`}
              title={edaViewerTitle}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      )}
    </div>
  );
}
