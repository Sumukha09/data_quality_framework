import { useState, useCallback } from "react";
import { processData, retrieveAnalysis } from "../api";
import { buildPayload } from "../services/dashboardService";

/**
 * Custom hook for managing Dashboard state and operations.
 */
export function useDashboard() {
  const [report, setReport] = useState(null);
  const [rawReport, setRawReport] = useState(null);
  const [cleanedReport, setCleanedReport] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [cleanedData, setCleanedData] = useState([]);
  const [reportUrl, setReportUrl] = useState(null);
  const [edaUrl, setEdaUrl] = useState(null);
  const [rawEdaUrl, setRawEdaUrl] = useState(null);
  const [analysisId, setAnalysisId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const executeAnalysis = useCallback(async (formState) => {
    setError(null);
    setProcessing(true);
    setReport(null);
    setRawReport(null);
    setCleanedReport(null);
    setRawData([]);
    setCleanedData([]);
    setReportUrl(null);

    try {
      const payload = buildPayload(formState);
      const data = await processData(payload);

      setReport(data.report);
      setRawReport(data.raw_report);
      setCleanedReport(data.cleaned_report);
      setReportUrl(data.report_url);
      setEdaUrl(data.eda_url);
      setRawEdaUrl(data.raw_eda_url);
      setAnalysisId(data.id || data.report?.id);

      // Get raw data (before cleaning)
      const rawList = data.raw_data?.data || data.raw_data?.properties || [];
      setRawData(Array.isArray(rawList) ? rawList : []);

      // Get cleaned data (after remediation)
      const cleanedList =
        data.cleaned_data?.data || data.cleaned_data?.properties || [];
      setCleanedData(Array.isArray(cleanedList) ? cleanedList : []);

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setProcessing(false);
    }
  }, []);

  const loadRemoteAnalysis = useCallback(async (fileId) => {
    setError(null);
    setProcessing(true);
    try {
      const data = await retrieveAnalysis(fileId);
      
      setReport(data); // In our backend, record contains full report if not expired
      setReportUrl(data.analysis_report_url);
      setEdaUrl(data.eda_profile_url);
      setRawEdaUrl(data.raw_eda_profile_url);
      setAnalysisId(data.id);
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setProcessing(false);
    }
  }, []);

  const resetDashboard = useCallback(() => {
    setReport(null);
    setRawReport(null);
    setCleanedReport(null);
    setRawData([]);
    setCleanedData([]);
    setReportUrl(null);
    setEdaUrl(null);
    setRawEdaUrl(null);
    setAnalysisId(null);
    setError(null);
  }, []);

  return {
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
  };
}
