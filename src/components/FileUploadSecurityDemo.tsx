import React, { useState, useEffect } from 'react';
import '../styles/file-upload-security-demo.css';

interface FileAnalysis {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadTime: Date;
  securityStatus: 'safe' | 'suspicious' | 'dangerous' | 'blocked';
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  analysisResults: {
    virusScan: 'clean' | 'infected' | 'scanning';
    fileTypeValidation: 'valid' | 'invalid' | 'suspicious';
    contentAnalysis: 'safe' | 'malicious' | 'review';
    encryptionStatus: 'encrypted' | 'unencrypted' | 'mixed';
  };
  securityActions: string[];
  riskScore: number;
  allowed: boolean;
}

interface DemoScenario {
  name: string;
  description: string;
  files: Array<{
    name: string;
    type: string;
    size: number;
    content: string;
    expectedResult: 'safe' | 'suspicious' | 'dangerous' | 'blocked';
  }>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

const FileUploadSecurityDemo: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<string>('normal');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileAnalyses, setFileAnalyses] = useState<FileAnalysis[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [securityLog, setSecurityLog] = useState<string[]>([]);

  // Define demo scenarios
  const demoScenarios: DemoScenario[] = [
    {
      name: 'Normal Healthcare Documents',
      description: 'Regular medical documents like patient records, prescriptions, and lab reports',
      files: [
        { name: 'patient_medical_record.pdf', type: 'application/pdf', size: 245760, content: 'Patient medical history and treatment notes', expectedResult: 'safe' },
        { name: 'lab_results.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 156800, content: 'Blood test results and analysis', expectedResult: 'safe' },
        { name: 'prescription.jpg', type: 'image/jpeg', size: 89200, content: 'Doctor prescription image', expectedResult: 'safe' }
      ],
      riskLevel: 'low'
    },
    {
      name: 'Suspicious File Types',
      description: 'Files with potentially dangerous extensions or unusual characteristics',
      files: [
        { name: 'medical_report.exe', type: 'application/x-msdownload', size: 2048000, content: 'Executable file claiming to be medical report', expectedResult: 'blocked' },
        { name: 'patient_data.bat', type: 'application/x-msdos-program', size: 5120, content: 'Batch script file', expectedResult: 'blocked' },
        { name: 'lab_results.js', type: 'application/javascript', size: 12800, content: 'JavaScript file with medical data', expectedResult: 'suspicious' }
      ],
      riskLevel: 'high'
    },
    {
      name: 'Malicious Content',
      description: 'Files containing potentially harmful content or code',
      files: [
        { name: 'patient_info.html', type: 'text/html', size: 25600, content: '<script>alert("XSS Attack")</script>Patient data', expectedResult: 'dangerous' },
        { name: 'medical_report.doc', type: 'application/msword', size: 512000, content: 'Document with embedded macros and suspicious links', expectedResult: 'dangerous' },
        { name: 'lab_data.zip', type: 'application/zip', size: 1024000, content: 'Compressed file with hidden executable content', expectedResult: 'suspicious' }
      ],
      riskLevel: 'critical'
    },
    {
      name: 'Large File Attacks',
      description: 'Attempts to upload extremely large files to cause system issues',
      files: [
        { name: 'huge_medical_file.zip', type: 'application/zip', size: 1073741824, content: 'Extremely large compressed file (1GB)', expectedResult: 'blocked' },
        { name: 'patient_archive.rar', type: 'application/x-rar-compressed', size: 536870912, content: 'Large archive file (500MB)', expectedResult: 'blocked' },
        { name: 'medical_database.sql', type: 'application/sql', size: 268435456, content: 'Large database dump file (250MB)', expectedResult: 'suspicious' }
      ],
      riskLevel: 'high'
    }
  ];

  const currentScenario = demoScenarios.find(s => s.name === selectedScenario) || demoScenarios[0];

  // Simulate file security analysis
  const analyzeFileSecurity = async (file: any, expectedResult: string): Promise<FileAnalysis> => {
    const analysis: FileAnalysis = {
      id: `file-${Date.now()}-${Math.random()}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadTime: new Date(),
      securityStatus: 'safe',
      threatLevel: 'low',
      analysisResults: {
        virusScan: 'clean',
        fileTypeValidation: 'valid',
        contentAnalysis: 'safe',
        encryptionStatus: 'unencrypted'
      },
      securityActions: [],
      riskScore: 0,
      allowed: true
    };

    // Simulate security analysis based on file characteristics
    if (file.type.includes('executable') || file.type.includes('msdownload') || file.type.includes('dos-program')) {
      analysis.securityStatus = 'blocked';
      analysis.threatLevel = 'critical';
      analysis.analysisResults.fileTypeValidation = 'invalid';
      analysis.analysisResults.contentAnalysis = 'malicious';
      analysis.securityActions = ['File type blocked', 'Executable files not allowed', 'Quarantined for review'];
      analysis.riskScore = 95;
      analysis.allowed = false;
    } else if (file.size > 100000000) { // 100MB limit
      analysis.securityStatus = 'blocked';
      analysis.threatLevel = 'high';
      analysis.analysisResults.fileTypeValidation = 'valid';
      analysis.analysisResults.contentAnalysis = 'review';
      analysis.securityActions = ['File size exceeds limit', 'Compression recommended', 'Contact administrator'];
      analysis.riskScore = 80;
      analysis.allowed = false;
    } else if (file.content.includes('<script>') || file.content.includes('javascript:')) {
      analysis.securityStatus = 'dangerous';
      analysis.threatLevel = 'high';
      analysis.analysisResults.fileTypeValidation = 'valid';
      analysis.analysisResults.contentAnalysis = 'malicious';
      analysis.securityActions = ['Malicious content detected', 'XSS protection activated', 'File quarantined'];
      analysis.riskScore = 85;
      analysis.allowed = false;
    } else if (file.type === 'application/javascript' || file.type === 'text/html') {
      analysis.securityStatus = 'suspicious';
      analysis.threatLevel = 'medium';
      analysis.analysisResults.fileTypeValidation = 'suspicious';
      analysis.analysisResults.contentAnalysis = 'review';
      analysis.securityActions = ['Code file detected', 'Manual review required', 'Limited access granted'];
      analysis.riskScore = 60;
      analysis.allowed = false;
    } else {
      analysis.securityStatus = 'safe';
      analysis.threatLevel = 'low';
      analysis.analysisResults.fileTypeValidation = 'valid';
      analysis.analysisResults.contentAnalysis = 'safe';
      analysis.securityActions = ['File validated', 'Security checks passed', 'Upload approved'];
      analysis.riskScore = 10;
      analysis.allowed = true;
    }

    // Add encryption status
    if (file.type.includes('pdf') || file.type.includes('docx')) {
      analysis.analysisResults.encryptionStatus = 'encrypted';
    }

    return analysis;
  };

  const runSecurityDemo = async () => {
    setIsProcessing(true);
    setFileAnalyses([]);
    setSecurityLog([]);
    setUploadProgress(0);

    const newAnalyses: FileAnalysis[] = [];
    const newLog: string[] = [];

    for (let i = 0; i < currentScenario.files.length; i++) {
      const file = currentScenario.files[i];
      
      // Simulate upload progress
      setUploadProgress(((i + 1) / currentScenario.files.length) * 100);
      
      // Add security log entry
      newLog.push(`🔍 Analyzing file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      setSecurityLog([...newLog]);

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Analyze file security
      const analysis = await analyzeFileSecurity(file, file.expectedResult);
      newAnalyses.push(analysis);

      // Update results
      setFileAnalyses([...newAnalyses]);

      // Add result to log
      const statusIcon = analysis.allowed ? '✅' : '❌';
      newLog.push(`${statusIcon} ${file.name}: ${analysis.securityStatus.toUpperCase()} - Risk: ${analysis.threatLevel}`);
      setSecurityLog([...newLog]);
    }

    setUploadProgress(100);
    setIsProcessing(false);
  };

  const clearDemo = () => {
    setFileAnalyses([]);
    setSecurityLog([]);
    setUploadProgress(0);
  };

  const getSecurityStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-green-100 text-green-800 border-green-200';
      case 'suspicious': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'dangerous': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'blocked': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score <= 25) return 'text-green-600';
    if (score <= 50) return 'text-yellow-600';
    if (score <= 75) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          File Upload Security Demo
        </h1>
        <p className="text-lg text-gray-600 max-w-4xl mx-auto">
          See how LingapLink protects against malicious file uploads and ensures secure document handling. 
          Watch our advanced security system analyze files in real-time and block potential threats.
        </p>
      </div>

      {/* Scenario Selection */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Select Security Test Scenario</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {demoScenarios.map((scenario) => (
            <button
              key={scenario.name}
              onClick={() => setSelectedScenario(scenario.name)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedScenario === scenario.name
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800 text-sm">{scenario.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getThreatLevelColor(scenario.riskLevel)}`}>
                  {scenario.riskLevel}
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-2">{scenario.description}</p>
              <p className="text-xs text-blue-600">{scenario.files.length} files to test</p>
            </button>
          ))}
        </div>
      </div>

      {/* Current Scenario Info */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Scenario: {currentScenario.name}
            </h2>
            <p className="text-gray-600 mb-4">{currentScenario.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Files to Test</h3>
                <ul className="space-y-2">
                  {currentScenario.files.map((file, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Expected Results</h3>
                <div className="space-y-2">
                  {currentScenario.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{file.name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSecurityStatusColor(file.expectedResult)}`}>
                        {file.expectedResult}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Run Security Analysis</h2>
        <div className="flex gap-4 mb-4">
          <button
            onClick={runSecurityDemo}
            disabled={isProcessing}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Analyzing Files...
              </>
            ) : (
              'Start Security Analysis'
            )}
          </button>
          <button
            onClick={clearDemo}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Clear Results
          </button>
        </div>

        {/* Upload Progress */}
        {isProcessing && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* Security Log */}
      {securityLog.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Security Analysis Log</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
            {securityLog.map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-400">[{new Date().toLocaleTimeString()}]</span> {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Analysis Results */}
      {fileAnalyses.length > 0 && (
        <div className="space-y-6">
          {fileAnalyses.map((analysis) => (
            <div key={analysis.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className={`p-4 ${
                analysis.allowed ? 'bg-green-600' : 'bg-red-600'
              } text-white`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">{analysis.fileName}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSecurityStatusColor(analysis.securityStatus)}`}>
                      {analysis.securityStatus.toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getThreatLevelColor(analysis.threatLevel)}`}>
                      {analysis.threatLevel.toUpperCase()}
                    </span>
                  </div>
                </div>
                <p className="text-sm opacity-90">
                  Size: {(analysis.fileSize / 1024).toFixed(1)} KB | Type: {analysis.fileType}
                </p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Analysis Results */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Security Analysis Results</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Virus Scan:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          analysis.analysisResults.virusScan === 'clean' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {analysis.analysisResults.virusScan}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">File Type Validation:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          analysis.analysisResults.fileTypeValidation === 'valid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {analysis.analysisResults.fileTypeValidation}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Content Analysis:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          analysis.analysisResults.contentAnalysis === 'safe' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {analysis.analysisResults.contentAnalysis}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Encryption Status:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          analysis.analysisResults.encryptionStatus === 'encrypted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {analysis.analysisResults.encryptionStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Security Actions & Risk Score */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Security Actions & Risk Assessment</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Risk Score:</span>
                        <span className={`text-lg font-bold ${getRiskScoreColor(analysis.riskScore)}`}>
                          {analysis.riskScore}/100
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Upload Status:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          analysis.allowed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {analysis.allowed ? 'ALLOWED' : 'BLOCKED'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 block mb-2">Security Actions Taken:</span>
                        <ul className="space-y-1">
                          {analysis.securityActions.map((action, index) => (
                            <li key={index} className="text-xs text-gray-700 flex items-center">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security Features */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">File Upload Security Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Real-Time Threat Detection</h3>
            <p className="text-sm text-blue-700">
              Advanced AI analyzes files instantly for malware, suspicious content, and security threats
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">File Type Validation</h3>
            <p className="text-sm text-green-700">
              Strict validation ensures only safe file types are allowed, blocking dangerous executables
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">Content Analysis</h3>
            <p className="text-sm text-purple-700">
              Deep scanning detects hidden malicious code, scripts, and suspicious patterns
            </p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <h3 className="font-semibold text-orange-800 mb-2">Size & Rate Limiting</h3>
            <p className="text-sm text-orange-700">
              Prevents denial-of-service attacks through file size limits and upload rate controls
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-2">Quarantine System</h3>
            <p className="text-sm text-red-700">
              Suspicious files are automatically quarantined for manual review by security experts
            </p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-lg">
            <h3 className="font-semibold text-indigo-800 mb-2">HIPAA Compliance</h3>
            <p className="text-sm text-indigo-700">
              Meets healthcare security standards for document uploads and file handling
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">How File Upload Security Works in LingapLink</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              1
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">File Upload Initiated</h3>
              <p className="text-gray-600">When a user attempts to upload a file, it's immediately intercepted by our security system</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              2
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Initial Security Scan</h3>
              <p className="text-gray-600">File type, size, and basic characteristics are validated against security policies</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              3
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Deep Content Analysis</h3>
              <p className="text-gray-600">AI-powered scanning examines file contents for malicious code, scripts, and threats</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              4
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Threat Assessment</h3>
              <p className="text-gray-600">System calculates risk score and determines if file should be allowed, quarantined, or blocked</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              5
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Action & Logging</h3>
              <p className="text-gray-600">Security action is taken and all activity is logged for compliance and audit purposes</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <p className="text-blue-800 text-sm">
            <strong>Why this matters:</strong> Healthcare organizations are prime targets for cyberattacks. 
            Our file upload security ensures that malicious files can never compromise patient data or system integrity, 
            while allowing legitimate medical documents to be uploaded safely and efficiently.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FileUploadSecurityDemo;

