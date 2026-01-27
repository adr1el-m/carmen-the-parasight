import React, { useState, useEffect } from 'react';
import '../styles/audit-logs-demo.css';

interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userRole: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceName: string;
  actionResult: 'success' | 'failure' | 'denied';
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  hipaaCompliant: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  processingTime: number;
  correlationId: string;
}

interface DemoScenario {
  name: string;
  description: string;
  actions: string[];
  expectedLogs: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

const AuditLogsDemo: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('normal');
  const [isProcessing, setIsProcessing] = useState(false);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [filters, setFilters] = useState({
    riskLevel: 'all',
    actionResult: 'all',
    userRole: 'all'
  });

  // Define demo scenarios
  const demoScenarios: DemoScenario[] = [
    {
      name: 'Normal Healthcare Operations',
      description: 'Regular patient care activities with proper authorization',
      actions: ['View patient records', 'Update medical history', 'Schedule appointment', 'Prescribe medication'],
      expectedLogs: 4,
      riskLevel: 'low'
    },
    {
      name: 'Suspicious Access Patterns',
      description: 'Multiple failed login attempts and unusual data access',
      actions: ['Failed login attempt', 'Failed login attempt', 'Failed login attempt', 'Failed login attempt', 'Failed login attempt', 'Unauthorized data access'],
      expectedLogs: 6,
      riskLevel: 'high'
    },
    {
      name: 'Emergency Access',
      description: 'Emergency medical access with elevated permissions',
      actions: ['Emergency patient access', 'Override consent', 'Critical data modification', 'Emergency treatment authorization'],
      expectedLogs: 4,
      riskLevel: 'medium'
    },
    {
      name: 'Administrative Operations',
      description: 'System administration and compliance activities',
      actions: ['Generate compliance report', 'Review audit logs', 'Update user permissions', 'System configuration change'],
      expectedLogs: 4,
      riskLevel: 'low'
    }
  ];

  const currentScenario = demoScenarios.find(s => s.name === selectedScenario) || demoScenarios[0];

  // Generate sample audit logs
  const generateAuditLogs = async (scenario: DemoScenario) => {
    setIsProcessing(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newLogs: AuditLog[] = [];
    const baseTime = new Date();
    
    scenario.actions.forEach((action, index) => {
      const timestamp = new Date(baseTime.getTime() - (scenario.actions.length - index) * 60000);
      const isFailed = action.includes('Failed') || action.includes('Unauthorized');
      const isEmergency = action.includes('Emergency');
      
      const log: AuditLog = {
        id: `log-${Date.now()}-${index}`,
        timestamp,
        userId: isEmergency ? 'EMERGENCY-001' : `user-${Math.floor(Math.random() * 1000)}`,
        userRole: isEmergency ? 'Emergency Physician' : 
                  isFailed ? 'Unknown' : 
                  ['Doctor', 'Nurse', 'Admin', 'Patient'][Math.floor(Math.random() * 4)],
        userEmail: isEmergency ? 'emergency@lingaplink.ph' : 
                   isFailed ? 'unknown@attacker.com' : 
                   `user${Math.floor(Math.random() * 1000)}@lingaplink.ph`,
        action,
        resourceType: ['patient_record', 'appointment', 'medication', 'system', 'user'][Math.floor(Math.random() * 5)],
        resourceId: `res-${Math.floor(Math.random() * 10000)}`,
        resourceName: action.includes('patient') ? 'Patient Medical Record' : 
                     action.includes('appointment') ? 'Appointment Schedule' : 
                     action.includes('medication') ? 'Medication Database' : 'System Resource',
        actionResult: isFailed ? 'failure' : 'success',
        ipAddress: isFailed ? '192.168.1.100' : 
                   isEmergency ? '10.0.0.1' : 
                   `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        userAgent: isFailed ? 'Mozilla/5.0 (Unknown Browser)' : 
                   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        sessionId: `sess-${Math.floor(Math.random() * 100000)}`,
        hipaaCompliant: !isFailed,
        riskLevel: isFailed ? 'critical' : isEmergency ? 'medium' : 'low',
        processingTime: Math.floor(Math.random() * 100) + 50,
        correlationId: `corr-${Date.now()}-${index}`
      };
      
      newLogs.push(log);
    });

    setAuditLogs(newLogs);
    setFilteredLogs(newLogs);
    setIsProcessing(false);
  };

  // Filter logs based on selected criteria
  useEffect(() => {
    let filtered = auditLogs;
    
    if (filters.riskLevel !== 'all') {
      filtered = filtered.filter(log => log.riskLevel === filters.riskLevel);
    }
    
    if (filters.actionResult !== 'all') {
      filtered = filtered.filter(log => log.actionResult === filters.actionResult);
    }
    
    if (filters.userRole !== 'all') {
      filtered = filtered.filter(log => log.userRole === filters.userRole);
    }
    
    setFilteredLogs(filtered);
  }, [filters, auditLogs]);

  const clearLogs = () => {
    setAuditLogs([]);
    setFilteredLogs([]);
  };

  const exportLogs = () => {
    const csvContent = [
      'Timestamp,User ID,User Role,User Email,Action,Resource Type,Resource ID,Resource Name,Action Result,IP Address,User Agent,Session ID,HIPAA Compliant,Risk Level,Processing Time,Correlation ID',
      ...filteredLogs.map(log => 
        `${log.timestamp.toISOString()},${log.userId},${log.userRole},${log.userEmail},${log.action},${log.resourceType},${log.resourceId},${log.resourceName},${log.actionResult},${log.ipAddress},${log.userAgent},${log.sessionId},${log.hipaaCompliant},${log.riskLevel},${log.processingTime},${log.correlationId}`
      ).join('\n')
    ];
    
    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionResultColor = (result: string) => {
    switch (result) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'failure': return 'bg-red-100 text-red-800 border-red-200';
      case 'denied': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Audit Logs & Compliance Monitoring Demo
        </h1>
        <p className="text-lg text-gray-600 max-w-4xl mx-auto">
          See how LingapLink tracks every single action in the system for security, compliance, and transparency. 
          Every login, data access, and system change is automatically logged and monitored in real-time.
        </p>
      </div>

      {/* Scenario Selection */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Select Demo Scenario</h2>
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
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(scenario.riskLevel)}`}>
                  {scenario.riskLevel}
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-2">{scenario.description}</p>
              <p className="text-xs text-blue-600">Expected: {scenario.expectedLogs} logs</p>
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Actions to Simulate</h3>
                <ul className="space-y-1">
                  {currentScenario.actions.map((action, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Risk Assessment</h3>
                <div className={`inline-block px-3 py-2 rounded-lg text-sm font-medium ${getRiskLevelColor(currentScenario.riskLevel)}`}>
                  Risk Level: {currentScenario.riskLevel.toUpperCase()}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  This scenario will generate {currentScenario.expectedLogs} audit log entries with varying risk levels.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Compliance Impact</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    HIPAA Compliance Tracking
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                    Real-time Monitoring
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                    Audit Trail Generation
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Generate Audit Logs</h2>
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => generateAuditLogs(currentScenario)}
            disabled={isProcessing}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Generating Logs...
              </>
            ) : (
              'Generate Audit Logs'
            )}
          </button>
          <button
            onClick={clearLogs}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Clear Logs
          </button>
          <button
            onClick={exportLogs}
            disabled={filteredLogs.length === 0}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Export to CSV
          </button>
        </div>
        
        {auditLogs.length > 0 && (
          <div className="text-sm text-gray-600">
            Generated {auditLogs.length} audit log entries. Use filters below to analyze specific patterns.
          </div>
        )}
      </div>

      {/* Filters */}
      {auditLogs.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Filter & Analyze Logs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
              <select
                value={filters.riskLevel}
                onChange={(e) => setFilters({...filters, riskLevel: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
                <option value="critical">Critical Risk</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Action Result</label>
              <select
                value={filters.actionResult}
                onChange={(e) => setFilters({...filters, actionResult: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Results</option>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
                <option value="denied">Denied</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User Role</label>
              <select
                value={filters.userRole}
                onChange={(e) => setFilters({...filters, userRole: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="Doctor">Doctor</option>
                <option value="Nurse">Nurse</option>
                <option value="Admin">Admin</option>
                <option value="Patient">Patient</option>
                <option value="Emergency Physician">Emergency Physician</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredLogs.length} of {auditLogs.length} logs
          </div>
        </div>
      )}

      {/* Audit Logs Display */}
      {filteredLogs.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="bg-gray-800 text-white p-4">
            <h2 className="text-xl font-bold">Audit Log Entries</h2>
            <p className="text-gray-300 text-sm">Real-time monitoring of all system activities</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HIPAA</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {log.timestamp.toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{log.userId}</div>
                        <div className="text-sm text-gray-500">{log.userRole}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{log.resourceName}</div>
                        <div className="text-sm text-gray-500">{log.resourceId}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionResultColor(log.actionResult)}`}>
                        {log.actionResult}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(log.riskLevel)}`}>
                        {log.riskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {log.ipAddress}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        log.hipaaCompliant 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {log.hipaaCompliant ? '✓' : '✗'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Security Features */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Audit Log Security Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Real-Time Monitoring</h3>
            <p className="text-sm text-blue-700">
              Every action is logged instantly, providing immediate visibility into system activities
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">HIPAA Compliance</h3>
            <p className="text-sm text-green-700">
              Complete audit trail meets healthcare data protection requirements and audit standards
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">Risk Assessment</h3>
            <p className="text-sm text-purple-700">
              Automatic risk level classification for every action based on security impact
            </p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <h3 className="font-semibold text-orange-800 mb-2">Tamper-Proof Logs</h3>
            <p className="text-sm text-orange-700">
              Immutable audit trail that cannot be modified or deleted, ensuring data integrity
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-2">Threat Detection</h3>
            <p className="text-sm text-red-700">
              Identifies suspicious patterns and potential security threats in real-time
            </p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-lg">
            <h3 className="font-semibold text-indigo-800 mb-2">Comprehensive Tracking</h3>
            <p className="text-sm text-indigo-700">
              Tracks user identity, location, device, and context for complete accountability
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">How Audit Logging Works in LingapLink</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              1
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Action Detection</h3>
              <p className="text-gray-600">Every user action, from login to data access, is automatically detected by the system</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              2
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Context Capture</h3>
              <p className="text-gray-600">System captures user identity, location, device, timestamp, and action details</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              3
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Risk Assessment</h3>
              <p className="text-gray-600">AI-powered analysis determines risk level and compliance status of each action</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              4
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Secure Storage</h3>
              <p className="text-gray-600">Logs are encrypted and stored in tamper-proof storage with automatic backup</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              5
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Real-Time Analysis</h3>
              <p className="text-gray-600">Security teams can monitor, filter, and analyze logs in real-time for threat detection</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <p className="text-blue-800 text-sm">
            <strong>Why this matters:</strong> Complete audit logging is not just about compliance - it's about transparency, 
            security, and trust. Every action in LingapLink leaves a digital fingerprint that can be traced, 
            analyzed, and used to protect patient data and maintain system integrity.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsDemo;
