import React, { useState, useEffect } from 'react';
import { FiShield, FiTarget, FiZap, FiPlay, FiPause, FiRefreshCw } from 'react-icons/fi';
import { BiSearch, BiCode, BiServer } from 'react-icons/bi';
import { MdSecurity, MdBugReport } from 'react-icons/md';
import { 
  testBurpConnection, 
  startBurpScan, 
  getBurpScanStatus, 
  getBurpVulnerabilities, 
  getBurpProjects, 
  generateBurpPayloads 
} from '../utils/backgroundMessaging';

interface SecurityProject {
  id: string;
  name: string;
  target: string;
  status: 'active' | 'completed' | 'paused';
  findingsCount: number;
  created: string;
}

interface Finding {
  id: string;
  name: string;
  severity: 'high' | 'medium' | 'low' | 'info';
  url: string;
  status: 'new' | 'confirmed' | 'false_positive' | 'fixed';
}

interface BurpScanStatus {
  taskId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  progress?: number;
  url?: string;
}

interface SecurityDashboardProps {
  isDarkMode: boolean;
  onClose: () => void;
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ isDarkMode, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'scans' | 'payloads' | 'recon'>('overview');
  const [projects, setProjects] = useState<SecurityProject[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [burpScans, setBurpScans] = useState<BurpScanStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [burpConnected, setBurpConnected] = useState(false);

  // Initialize with empty data - will be populated from Burp MCP server
  useEffect(() => {
    const initializeSecurityData = async () => {
      try {
        // Test Burp connection
        const connectionTest = await testBurpConnection();
        if (connectionTest.type === 'burp_connection_result') {
          setBurpConnected(connectionTest.connected);
          console.log('Burp connection status:', connectionTest.connected);
        }

        // Load real projects and findings from Burp Suite
        const [projectsResponse, vulnerabilitiesResponse] = await Promise.all([
          getBurpProjects().catch(err => ({ type: 'error', error: err.message })),
          getBurpVulnerabilities().catch(err => ({ type: 'error', error: err.message }))
        ]);

        if (projectsResponse.type === 'burp_projects') {
          setProjects(projectsResponse.projects || []);
        }

        if (vulnerabilitiesResponse.type === 'burp_vulnerabilities') {
          setFindings(vulnerabilitiesResponse.vulnerabilities || []);
        }

      } catch (error) {
        console.error('Failed to initialize security data:', error);
        setBurpConnected(false);
      }
    };

    initializeSecurityData();
  }, []);

  const handleStartScan = async (target: string) => {
    setIsLoading(true);
    try {
      console.log('Starting Burp Suite scan for:', target);
      
      const response = await startBurpScan(target);
      
      if (response.type === 'burp_scan_started') {
        // Add new scan to the state
        setBurpScans(prev => [...prev, {
          taskId: response.taskId,
          status: 'running',
          url: target,
          progress: 0
        }]);
        
        console.log('Scan started successfully:', response.taskId);
      } else if (response.type === 'burp_scan_error') {
        alert(`Failed to start scan: ${response.error}`);
      } else {
        alert('Unexpected response from Burp Suite');
      }
      
    } catch (error) {
      console.error('Failed to start scan:', error);
      alert(`Error starting scan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

    const generatePayloads = async (type: string) => {
    setIsLoading(true);
    try {
      console.log('Generating payloads for:', type);
      
      const response = await generateBurpPayloads(type, 10);
      
      if (response.type === 'burp_payloads') {
        const payloads = response.payloads || [];
        console.log(`Generated ${payloads.length} ${type.toUpperCase()} payloads:`, payloads);
        
        // Show payloads in a more user-friendly way
        const payloadText = payloads.slice(0, 5).join('\n'); // Show first 5
        alert(`Generated ${payloads.length} ${type.toUpperCase()} payloads.\n\nFirst 5 examples:\n${payloadText}`);
      } else if (response.type === 'burp_payloads_error') {
        alert(`Failed to generate payloads: ${response.error}`);
      } else {
        alert('Unexpected response from Burp Suite');
      }
      
    } catch (error) {
      console.error('Failed to generate payloads:', error);
      alert(`Error generating payloads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-500 bg-red-100 dark:bg-red-900/20';
      case 'medium': return 'text-orange-500 bg-orange-100 dark:bg-orange-900/20';
      case 'low': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20';
      case 'info': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/20';
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const TabButton = ({ id, icon: Icon, label, active }: { 
    id: string; 
    icon: React.ComponentType<{ size?: number }>; 
    label: string; 
    active: boolean;
  }) => (
    <button
      onClick={() => setActiveTab(id as 'overview' | 'projects' | 'scans' | 'payloads' | 'recon')}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        active 
          ? (isDarkMode ? 'bg-sky-800 text-sky-200' : 'bg-sky-100 text-sky-700')
          : (isDarkMode ? 'text-sky-300 hover:bg-sky-900/50' : 'text-sky-600 hover:bg-sky-50')
      }`}
    >
      <Icon size={16} />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
        <div className="flex items-center space-x-2">
          <MdSecurity className="text-sky-500" size={24} />
          <h1 className="text-lg font-semibold">Security Testing</h1>
        </div>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className={`flex flex-wrap gap-2 p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
        <TabButton id="overview" icon={FiShield} label="Overview" active={activeTab === 'overview'} />
        <TabButton id="projects" icon={FiTarget} label="Projects" active={activeTab === 'projects'} />
        <TabButton id="scans" icon={FiZap} label="Scans" active={activeTab === 'scans'} />
        <TabButton id="payloads" icon={BiCode} label="Payloads" active={activeTab === 'payloads'} />
        <TabButton id="recon" icon={BiSearch} label="Recon" active={activeTab === 'recon'} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Active Projects</p>
                    <p className="text-2xl font-bold">{projects.filter(p => p.status === 'active').length}</p>
                  </div>
                  <FiTarget className="text-sky-500" size={24} />
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total Findings</p>
                    <p className="text-2xl font-bold">{findings.length}</p>
                  </div>
                  <MdBugReport className="text-orange-500" size={24} />
                </div>
              </div>
            </div>

            {/* Burp Suite Status */}
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Burp Suite Integration</h3>
                <div className={`flex items-center space-x-2 ${burpConnected ? 'text-green-500' : 'text-red-500'}`}>
                  <div className={`size-2 rounded-full ${burpConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm">{burpConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {burpConnected 
                  ? 'Ready to launch automated scans and retrieve findings'
                  : 'Start Burp Suite Professional with API enabled to connect'
                }
              </p>
            </div>

            {/* Recent Findings */}
            <div>
              <h3 className="font-semibold mb-3">Recent Findings</h3>
              <div className="space-y-2">
                {findings.length > 0 ? (
                  findings.slice(0, 3).map(finding => (
                    <div key={finding.id} className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{finding.name}</h4>
                          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{finding.url}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(finding.severity)}`}>
                          {finding.severity}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`p-6 text-center rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      No security findings yet. Start a scan to detect vulnerabilities.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Security Projects</h3>
              <button 
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm"
                onClick={() => console.log('Create new project')}
              >
                New Project
              </button>
            </div>
            
            <div className="space-y-3">
              {projects.length > 0 ? (
                projects.map(project => (
                  <div key={project.id} className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{project.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === 'active' ? 'text-green-700 bg-green-100 dark:bg-green-900/20' :
                        project.status === 'completed' ? 'text-blue-700 bg-blue-100 dark:bg-blue-900/20' :
                        'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/20'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} mb-2`}>
                      Target: {project.target}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        {project.findingsCount} findings
                      </span>
                      <button 
                        className="text-sky-500 hover:text-sky-600 text-sm"
                        onClick={() => handleStartScan(project.target)}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Starting...' : 'Quick Scan'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className={`p-8 text-center rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} mb-4`}>
                    No security projects yet. Create your first project to get started.
                  </p>
                  <button 
                    className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm"
                    onClick={() => console.log('Create first project')}
                  >
                    Create First Project
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'scans' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Active Scans</h3>
              <button 
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm"
                onClick={() => handleStartScan('https://httpbin.org')}
                disabled={isLoading}
              >
                {isLoading ? <FiRefreshCw className="animate-spin" size={16} /> : 'Start Scan'}
              </button>
            </div>
            
            <div className="space-y-3">
              {burpScans.length === 0 ? (
                <div className={`p-8 text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  <BiServer size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No active scans</p>
                  <p className="text-sm">Start a new scan to see results here</p>
                </div>
              ) : (
                burpScans.map(scan => (
                  <div key={scan.taskId} className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Scan {scan.taskId}</h4>
                      <div className="flex items-center space-x-2">
                        {scan.status === 'running' && <FiPlay className="text-green-500" size={16} />}
                        {scan.status === 'paused' && <FiPause className="text-yellow-500" size={16} />}
                        <span className="text-sm capitalize">{scan.status}</span>
                      </div>
                    </div>
                    {scan.url && (
                      <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} mb-2`}>
                        Target: {scan.url}
                      </p>
                    )}
                    {scan.progress !== undefined && (
                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div 
                          className="bg-sky-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${scan.progress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'payloads' && (
          <div className="space-y-4">
            <h3 className="font-semibold">Payload Generator</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <h4 className="font-medium mb-2 flex items-center space-x-2">
                  <BiCode size={16} />
                  <span>XSS Payloads</span>
                </h4>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} mb-3`}>
                  Generate cross-site scripting payloads for various contexts
                </p>
                <button 
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                  onClick={() => generatePayloads('xss')}
                  disabled={isLoading}
                >
                  Generate XSS Payloads
                </button>
              </div>

              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <h4 className="font-medium mb-2 flex items-center space-x-2">
                  <BiServer size={16} />
                  <span>SQL Injection</span>
                </h4>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} mb-3`}>
                  Generate SQL injection payloads for different databases
                </p>
                <button 
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                  onClick={() => generatePayloads('sqli')}
                  disabled={isLoading}
                >
                  Generate SQL Payloads
                </button>
              </div>

              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <h4 className="font-medium mb-2 flex items-center space-x-2">
                  <FiZap size={16} />
                  <span>Command Injection</span>
                </h4>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} mb-3`}>
                  Generate command injection payloads for system exploitation
                </p>
                <button 
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
                  onClick={() => generatePayloads('cmd')}
                  disabled={isLoading}
                >
                  Generate CMD Payloads
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recon' && (
          <div className="space-y-4">
            <h3 className="font-semibold">Reconnaissance Tools</h3>
            
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <h4 className="font-medium mb-2">Subdomain Enumeration</h4>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} mb-3`}>
                  Discover subdomains for a target domain
                </p>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    placeholder="example.com"
                    className={`flex-1 px-3 py-2 rounded border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-slate-100' 
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <button className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600 transition-colors">
                    Enumerate
                  </button>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <h4 className="font-medium mb-2">Technology Fingerprinting</h4>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} mb-3`}>
                  Identify technologies used by a website
                </p>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    placeholder="https://example.com"
                    className={`flex-1 px-3 py-2 rounded border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-slate-100' 
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                    Fingerprint
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityDashboard;