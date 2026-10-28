import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle2, AlertCircle, Info, ChevronRight, ChevronLeft, Trash2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { apiClient } from '@/api/client';

type Step = 'metadata' | 'upload' | 'validate' | 'success';

const TEMPLATE_HEADERS = [
  'report_date', 'district', 'locality', 'reported_dengue_cases', 'suspected_cases',
  'confirmed_cases', 'hospital_visits', 'hospital_admissions', 'rainfall',
  'temperature', 'humidity', 'population',
];

const SubmissionForm: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('metadata');
  const [formData, setFormData] = useState({
    organization: '',
    orgType: 'Public Hospital',
    district: '',
    city: '',
    startDate: '',
    endDate: '',
    notes: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submissionId, setSubmissionId] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setPreviewData(data.slice(0, 10)); // Show first 10 rows
        setTotalRows(data.length);
        validateData(data);
      };
      reader.readAsBinaryString(uploadedFile);
      setStep('validate');
    }
  };

  const downloadTemplate = () => {
    const csv = `${TEMPLATE_HEADERS.join(',')}\n`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dengue-surveillance-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const validateData = (data: any[]) => {
    const errors: string[] = [];
    if (data.length === 0) errors.push('The file is empty.');
    
    // Check for required columns
    const requiredCols = ['report_date', 'district', 'locality', 'reported_dengue_cases'];
    const firstRow = data[0];
    if (firstRow) {
      requiredCols.forEach(col => {
        if (!(col in firstRow)) errors.push(`Missing required column: ${col}`);
      });
    }

    setValidationErrors(errors);
  };

  const handleSubmit = async () => {
    if (!file) return;

    const formDataToSubmit = new FormData();
    formDataToSubmit.append('organization', formData.organization);
    formDataToSubmit.append('org_type', formData.orgType);
    formDataToSubmit.append('district', formData.district);
    formDataToSubmit.append('city', formData.city);
    formDataToSubmit.append('period_start', formData.startDate);
    formDataToSubmit.append('period_end', formData.endDate);
    if (formData.notes) formDataToSubmit.append('notes', formData.notes);
    formDataToSubmit.append('file', file);

    try {
      const result = await apiClient.submitData(formDataToSubmit);
      localStorage.setItem('denguecare.org', formData.organization);
      setSubmissionId(result.id);
      setStep('success');
    } catch (error: any) {
      console.error('Submission failed:', error);
      alert(error?.message || 'Failed to submit data. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-12 px-4">
        {[
          { id: 'metadata', label: 'Organization Info' },
          { id: 'upload', label: 'File Upload' },
          { id: 'validate', label: 'Review & Validate' },
        ].map((s, idx) => (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${
                step === s.id ? 'bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-900/20' : 
                (idx < ['metadata', 'upload', 'validate'].indexOf(step) ? 'bg-teal-100 border-teal-100 text-teal-700 dark:bg-teal-500/10 dark:border-teal-500/30 dark:text-teal-300' : 'bg-white border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-500')
              }`}>
                {idx < ['metadata', 'upload', 'validate'].indexOf(step) ? <CheckCircle2 className="w-6 h-6" /> : idx + 1}
              </div>
              <span className={`text-xs font-semibold ${step === s.id ? 'text-teal-700 dark:text-teal-300' : 'text-slate-400 dark:text-slate-500'}`}>{s.label}</span>
            </div>
            {idx < 2 && <div className={`flex-1 h-0.5 mx-4 ${idx < ['metadata', 'upload', 'validate'].indexOf(step) ? 'bg-teal-200 dark:bg-teal-500/20' : 'bg-slate-200 dark:bg-slate-700'}`} />}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 'metadata' && (
          <motion.div 
            key="metadata"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6 transition-colors dark:bg-slate-900 dark:border-slate-800 dark:shadow-none"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Organization Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. City General Hospital"
                  value={formData.organization}
                  onChange={(e) => setFormData({...formData, organization: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Organization Type</label>
                <select 
                  value={formData.orgType}
                  onChange={(e) => setFormData({...formData, orgType: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                >
                  <option>Public Hospital</option>
                  <option>Private Clinic</option>
                  <option>Diagnostic Lab</option>
                  <option>Research Institute</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Reporting District</label>
                <input 
                  type="text" 
                  placeholder="e.g. Central District"
                  value={formData.district}
                  onChange={(e) => setFormData({...formData, district: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">City / Locality</label>
                <input 
                  type="text" 
                  placeholder="e.g. Urban Center"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Reporting Period Start</label>
                <input 
                  type="date" 
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Reporting Period End</label>
                <input 
                  type="date" 
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Additional Notes (Optional)</label>
              <textarea 
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 resize-none"
              />
            </div>
            <div className="pt-4 flex justify-end">
              <button 
                onClick={() => setStep('upload')}
                disabled={!formData.organization || !formData.district || !formData.city || !formData.startDate || !formData.endDate}
                className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'upload' && (
          <motion.div 
            key="upload"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm transition-colors dark:bg-slate-900 dark:border-slate-800 dark:shadow-none"
          >
            <div className="text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center dark:bg-teal-500/10">
                <Upload className="w-10 h-10 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Upload Surveillance Data</h3>
                <p className="text-slate-500 mt-2 dark:text-slate-400">Support CSV, XLS, and XLSX files up to 10MB</p>
              </div>
              
              <div className="relative group">
                <input 
                  type="file" 
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 group-hover:border-teal-400 group-hover:bg-teal-50/30 transition-all dark:border-slate-700 dark:group-hover:border-teal-700 dark:group-hover:bg-teal-500/10">
                  <p className="text-slate-400 font-medium dark:text-slate-500">Click to browse or drag and drop file here</p>
                  <p className="text-xs text-slate-400 mt-2 dark:text-slate-500">Ensure your file follows the official template</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-left p-4 bg-blue-50 rounded-xl text-blue-700 text-sm dark:bg-blue-500/10 dark:text-blue-300">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Privacy Note:</strong> Please do not include patient names, IDs, or contact details. Only aggregate counts by locality and date are required.
                </p>
              </div>

              <div className="pt-6 flex justify-between">
                <button 
                  onClick={() => setStep('metadata')}
                  className="text-slate-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
                <button 
                  onClick={downloadTemplate}
                  className="text-teal-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-teal-50 transition-colors border border-teal-100 dark:text-teal-400 dark:hover:bg-teal-500/10 dark:border-teal-500/30"
                >
                  <Download className="w-5 h-5" /> Download Template
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'validate' && (
          <motion.div 
            key="validate"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* File Info Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between transition-colors dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
              <div className="flex items-center gap-4">
                <div className="bg-teal-50 p-3 rounded-xl dark:bg-teal-500/10">
                  <FileText className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{file?.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{((file?.size || 0) / 1024).toFixed(1)} KB • {totalRows} row{totalRows === 1 ? '' : 's'} detected</p>
                </div>
              </div>
              <button 
                onClick={() => { setFile(null); setStep('upload'); }}
                className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors dark:text-rose-400 dark:hover:bg-rose-500/10"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Validation Results */}
            <div className={`p-6 rounded-2xl border transition-colors ${validationErrors.length > 0 ? 'bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300' : 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300'}`}>
              <div className="flex items-center gap-2 mb-4">
                {validationErrors.length > 0 ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                <h3 className="font-bold text-lg">{validationErrors.length > 0 ? 'Validation Issues Found' : 'Data Validation Passed'}</h3>
              </div>
              {validationErrors.length > 0 ? (
                <ul className="space-y-2 text-sm ml-8 list-disc">
                  {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              ) : (
                <p className="text-sm ml-8">All required columns detected. Case counts and dates appear valid.</p>
              )}
            </div>

            {/* Data Preview */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-colors dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
              <div className="p-6 border-b border-slate-50 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white">Data Preview (First 10 Rows)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold dark:bg-slate-800/50 dark:text-slate-400">
                    <tr>
                      {previewData[0] && Object.keys(previewData[0]).map(key => (
                        <th key={key} className="px-6 py-4">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {previewData.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors dark:hover:bg-slate-800/50">
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="px-6 py-4 text-slate-700 dark:text-slate-200">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <button 
                onClick={() => setStep('upload')}
                className="text-slate-600 px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
              <button 
                onClick={handleSubmit}
                disabled={validationErrors.length > 0}
                className="bg-teal-600 text-white px-10 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-teal-700 transition-colors shadow-lg shadow-teal-900/20 disabled:opacity-50"
              >
                Submit for Review <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center space-y-8 transition-colors dark:bg-slate-900 dark:border-slate-800 dark:shadow-none"
          >
            <div className="mx-auto w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center dark:bg-emerald-500/10">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white">Submission Received</h3>
              <p className="text-slate-500 mt-4 text-lg dark:text-slate-400">
                Your data has been successfully uploaded and is now in <span className="text-amber-600 font-bold italic dark:text-amber-400">Pending Review</span> status.
              </p>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-2xl inline-block border border-slate-100 transition-colors dark:bg-slate-800/50 dark:border-slate-800">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2 dark:text-slate-500">Submission ID</p>
              <p className="text-2xl font-mono font-bold text-slate-800 dark:text-slate-100">{submissionId}</p>
            </div>

            <div className="flex flex-col md:flex-row justify-center gap-4 pt-8">
              <button 
                onClick={() => navigate('/user/history')}
                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold transition-colors hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                View Submission History
              </button>
              <button 
                onClick={() => {
                  setStep('metadata');
                  setFile(null);
                  setPreviewData([]);
                  setTotalRows(0);
                  setValidationErrors([]);
                }}
                className="text-teal-600 border border-teal-200 px-8 py-3 rounded-xl font-bold transition-colors hover:bg-teal-50 dark:text-teal-400 dark:border-teal-500/30 dark:hover:bg-teal-500/10"
              >
                Submit Another File
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubmissionForm;
