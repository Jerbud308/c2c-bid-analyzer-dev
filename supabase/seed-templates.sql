-- ============================================================================
-- Template Seed Data
-- ============================================================================
-- Provides starter templates for C2C Restoration bid responses
-- ============================================================================

-- Insert starter templates
INSERT INTO templates (title, category, content, variables, tags, status, created_by, approved_by, approved_at, usage_count) VALUES

-- ============================================================================
-- COMPANY INFO TEMPLATES
-- ============================================================================

(
  'Company Overview (Short)',
  'company_info',
  '<p><strong>{COMPANY_NAME}</strong> is a Service-Disabled Veteran-Owned Small Business (SDVOSB) specializing in commercial and government construction, restoration, and remediation services. Founded by {OWNER_NAME}, a disabled veteran, C2C brings decades of combined experience in construction management, roofing, asbestos abatement, and emergency response to every project.</p>

<p>With our proven track record serving federal, state, and local government agencies, we understand the unique requirements of public sector contracting including prevailing wage compliance, strict documentation standards, and security clearance protocols.</p>',
  '["COMPANY_NAME", "OWNER_NAME"]',
  ARRAY['company', 'overview', 'SDVOSB', 'veteran', 'general'],
  'approved',
  'Phil',
  'Phil',
  NOW(),
  0
),

(
  'Company Overview (Detailed)',
  'company_info',
  '<h2>About {COMPANY_NAME}</h2>

<p>{COMPANY_NAME} is a premier Service-Disabled Veteran-Owned Small Business (SDVOSB) and Veteran Business Enterprise (VBE) providing comprehensive construction, restoration, and remediation services to government and commercial clients across the southeastern United States.</p>

<h3>Company History</h3>
<p>Founded by {OWNER_NAME}, a disabled military veteran with extensive construction management experience, C2C Restoration has built a reputation for excellence in delivering complex projects on time and within budget. Our team combines military discipline with technical expertise to tackle the most challenging construction and restoration projects.</p>

<h3>Core Competencies</h3>
<ul>
  <li>Commercial and industrial roofing systems</li>
  <li>Asbestos and hazardous material abatement</li>
  <li>Interior construction and renovations</li>
  <li>Emergency response and disaster recovery</li>
  <li>Building envelope repairs and waterproofing</li>
  <li>General contracting and project management</li>
</ul>

<h3>Government Contracting Experience</h3>
<p>C2C has successfully completed numerous projects for the Department of Veterans Affairs, Department of Defense, General Services Administration, and other federal agencies. We maintain all required certifications and clearances for government work.</p>',
  '["COMPANY_NAME", "OWNER_NAME"]',
  ARRAY['company', 'overview', 'detailed', 'SDVOSB', 'veteran', 'history'],
  'approved',
  'Phil',
  'Phil',
  NOW(),
  0
),

-- ============================================================================
-- SAFETY PROGRAM TEMPLATES
-- ============================================================================

(
  'Safety Program Overview',
  'safety',
  '<h2>{COMPANY_NAME} Safety Program</h2>

<p>Safety is the cornerstone of every project undertaken by {COMPANY_NAME}. Our comprehensive safety program exceeds OSHA requirements and is tailored to the specific hazards of construction and remediation work.</p>

<h3>Safety Management System</h3>
<ul>
  <li><strong>Site-Specific Safety Plans:</strong> Developed for each project addressing unique hazards</li>
  <li><strong>Daily Safety Briefings:</strong> Conducted before each shift begins</li>
  <li><strong>Weekly Toolbox Talks:</strong> Regular safety training on relevant topics</li>
  <li><strong>Hazard Recognition:</strong> Proactive identification and mitigation of workplace hazards</li>
  <li><strong>Incident Reporting:</strong> Immediate reporting and investigation of all incidents</li>
</ul>

<h3>OSHA Compliance</h3>
<p>All C2C personnel receive OSHA 10-hour or 30-hour training appropriate to their role. Our safety director maintains current certifications and conducts regular site inspections to ensure full compliance with all applicable OSHA regulations including 29 CFR 1926 (Construction Standards) and 29 CFR 1910 (General Industry Standards).</p>

<h3>Safety Record</h3>
<p>C2C maintains an Experience Modification Rate (EMR) below industry average, demonstrating our commitment to creating safe work environments and preventing workplace injuries.</p>',
  '["COMPANY_NAME"]',
  ARRAY['safety', 'OSHA', 'compliance', 'program'],
  'approved',
  'Phil',
  'Phil',
  NOW(),
  0
),

-- ============================================================================
-- QUALITY CONTROL TEMPLATES
-- ============================================================================

(
  'Quality Control Approach',
  'quality',
  '<h2>Quality Control Program</h2>

<p>{COMPANY_NAME} implements a comprehensive Quality Control (QC) program to ensure all work meets or exceeds contract specifications and industry standards.</p>

<h3>Three-Phase Inspection Process</h3>

<p><strong>Phase 1: Pre-Installation Inspections</strong></p>
<ul>
  <li>Verify all materials meet specifications and have proper certifications</li>
  <li>Inspect substrate conditions and document existing conditions</li>
  <li>Confirm environmental conditions are within acceptable parameters</li>
</ul>

<p><strong>Phase 2: Work-in-Progress Inspections</strong></p>
<ul>
  <li>Daily foreman inspections of all active work areas</li>
  <li>Weekly QC manager inspections with photographic documentation</li>
  <li>Independent third-party testing when required by specifications</li>
</ul>

<p><strong>Phase 3: Final Inspections & Closeout</strong></p>
<ul>
  <li>Comprehensive punch list walkthrough with government representative</li>
  <li>Final cleaning and protection of completed work</li>
  <li>Complete as-built documentation and warranty information</li>
</ul>

<h3>Documentation & Reporting</h3>
<p>All QC activities are documented in daily reports with digital photographs. Inspection checklists are completed for each phase and maintained in the project file. Non-conformances are immediately documented, corrected, and re-inspected.</p>',
  '["COMPANY_NAME"]',
  ARRAY['quality', 'QC', 'inspection', 'testing'],
  'approved',
  'Phil',
  'Phil',
  NOW(),
  0
),

-- ============================================================================
-- PERSONNEL TEMPLATES
-- ============================================================================

(
  'Key Personnel: Phil Wright',
  'personnel',
  '<h3>Phil Wright - President & Project Executive</h3>

<p><strong>Education & Certifications:</strong></p>
<ul>
  <li>OSHA 30-Hour Construction Safety</li>
  <li>EPA Lead-Safe Certified</li>
  <li>Asbestos Contractor/Supervisor License</li>
</ul>

<p><strong>Experience Summary:</strong></p>
<p>Phil Wright is a disabled military veteran with over {YEARS_EXPERIENCE} years of experience in construction management and business operations. As President of {COMPANY_NAME}, Phil oversees all aspects of company operations including business development, project execution, safety, and quality control.</p>

<p><strong>Relevant Project Experience:</strong></p>
<ul>
  <li>VA Medical Center Building Envelope Repairs - Tampa, FL ($2.3M)</li>
  <li>Asbestos Abatement - MacDill AFB, FL (Multiple task orders)</li>
  <li>Emergency Roof Repairs - Various Federal Facilities</li>
</ul>

<p><strong>Government Contracting Expertise:</strong></p>
<p>Phil has successfully managed federal contracts requiring strict compliance with FAR regulations, prevailing wage (Davis-Bacon), and security protocols. His military background ensures disciplined execution and clear communication with government representatives.</p>',
  '["COMPANY_NAME", "YEARS_EXPERIENCE"]',
  ARRAY['personnel', 'resume', 'Phil', 'veteran', 'management'],
  'approved',
  'Phil',
  'Phil',
  NOW(),
  0
),

(
  'Key Personnel: Blake Harkcom',
  'personnel',
  '<h3>Blake Harkcom - Estimator & Project Manager</h3>

<p><strong>Education & Certifications:</strong></p>
<ul>
  <li>OSHA 30-Hour Construction Safety</li>
  <li>Certified Professional Estimator (CPE) - In Progress</li>
</ul>

<p><strong>Experience Summary:</strong></p>
<p>Blake Harkcom serves as lead estimator and project manager for {COMPANY_NAME}, bringing expertise in bid preparation, cost estimating, and project coordination. Blake is responsible for analyzing solicitations, preparing detailed cost proposals, and managing project execution from award through closeout.</p>

<p><strong>Core Competencies:</strong></p>
<ul>
  <li>Government bid analysis and proposal preparation</li>
  <li>Detailed cost estimating using RSMeans and industry databases</li>
  <li>Subcontractor coordination and procurement</li>
  <li>Project scheduling and resource management</li>
  <li>Contract administration and compliance</li>
</ul>

<p><strong>Project Experience:</strong></p>
<p>Blake has successfully estimated and managed projects ranging from $50,000 to $5,000,000 across various sectors including roofing, interior construction, and specialty abatement work.</p>',
  '["COMPANY_NAME"]',
  ARRAY['personnel', 'resume', 'Blake', 'estimator', 'project-manager'],
  'approved',
  'Phil',
  'Phil',
  NOW(),
  0
),

-- ============================================================================
-- PAST PROJECTS TEMPLATES
-- ============================================================================

(
  'Past Project: Roofing Example',
  'past_projects',
  '<h3>Project: {PROJECT_NAME}</h3>

<p><strong>Client:</strong> {AGENCY}<br>
<strong>Location:</strong> {LOCATION}<br>
<strong>Contract Value:</strong> {CONTRACT_VALUE}<br>
<strong>Completion Date:</strong> {COMPLETION_DATE}</p>

<p><strong>Project Description:</strong></p>
<p>This project involved complete roof replacement on a {BUILDING_SIZE} square foot government facility. The scope included removal of existing built-up roofing system, repair of damaged substrate, installation of new TPO roofing membrane, and replacement of all roof-mounted equipment curbs and flashings.</p>

<p><strong>Challenges & Solutions:</strong></p>
<ul>
  <li><strong>Challenge:</strong> Building remained fully occupied during construction
    <br><strong>Solution:</strong> Implemented phased construction schedule to minimize disruption, maintained strict dust control protocols</li>
  <li><strong>Challenge:</strong> Discovery of additional substrate damage not visible in original inspection
    <br><strong>Solution:</strong> Immediately notified Contracting Officer, submitted detailed change proposal with cost justification, obtained approval prior to proceeding</li>
</ul>

<p><strong>Results:</strong></p>
<p>Project completed on schedule despite unforeseen conditions. Final inspection passed with zero deficiencies. Client commended C2C for professionalism and communication throughout the project.</p>',
  '["PROJECT_NAME", "AGENCY", "LOCATION", "CONTRACT_VALUE", "COMPLETION_DATE", "BUILDING_SIZE"]',
  ARRAY['past-project', 'roofing', 'reference', 'example'],
  'approved',
  'Phil',
  'Phil',
  NOW(),
  0
),

-- ============================================================================
-- CAPABILITIES TEMPLATES
-- ============================================================================

(
  'Emergency Response Capabilities',
  'capabilities',
  '<h2>24/7 Emergency Response</h2>

<p>{COMPANY_NAME} maintains around-the-clock emergency response capabilities to address urgent facility needs including:</p>

<ul>
  <li><strong>Storm Damage Response:</strong> Rapid deployment for emergency roof repairs, water intrusion, and structural stabilization</li>
  <li><strong>Water Damage Mitigation:</strong> Immediate response to stop water intrusion and prevent secondary damage</li>
  <li><strong>Emergency Asbestos Response:</strong> Containment and removal of damaged asbestos-containing materials</li>
  <li><strong>Facility Securing:</strong> Board-up and temporary protection of damaged buildings</li>
</ul>

<h3>Response Protocol</h3>
<ol>
  <li><strong>Initial Contact (0-1 hour):</strong> Project manager contacts client to assess situation and mobilize resources</li>
  <li><strong>Site Assessment (1-4 hours):</strong> Senior technician arrives on-site to evaluate damage and implement immediate protective measures</li>
  <li><strong>Emergency Repairs (4-24 hours):</strong> Crew deployed to execute temporary repairs and secure facility</li>
  <li><strong>Permanent Solution (24-48 hours):</strong> Detailed scope and cost estimate provided for permanent repairs</li>
</ol>

<h3>Equipment & Resources</h3>
<p>C2C maintains a fleet of service vehicles stocked with emergency repair materials, safety equipment, and specialized tools to respond immediately to facility emergencies.</p>',
  '["COMPANY_NAME"]',
  ARRAY['capabilities', 'emergency', 'response', '24-7', 'storm'],
  'approved',
  'Phil',
  'Phil',
  NOW(),
  0
),

-- ============================================================================
-- CERTIFICATIONS TEMPLATE
-- ============================================================================

(
  'Certifications & Licenses',
  'certifications',
  '<h2>{COMPANY_NAME} Certifications & Licenses</h2>

<h3>Business Certifications</h3>
<ul>
  <li><strong>Service-Disabled Veteran-Owned Small Business (SDVOSB)</strong> - Verified by VA Center for Verification and Evaluation (CVE)</li>
  <li><strong>Veteran Business Enterprise (VBE)</strong> - State of Florida certification</li>
  <li><strong>SAM.gov Registration</strong> - Active and up-to-date</li>
  <li><strong>DUNS Number:</strong> [NUMBER]</li>
  <li><strong>CAGE Code:</strong> [CODE]</li>
</ul>

<h3>Technical Licenses & Certifications</h3>
<ul>
  <li>Florida State Certified General Contractor - License #CGC[NUMBER]</li>
  <li>Asbestos Contractor License - State of Florida</li>
  <li>EPA Lead-Safe Certified Firm</li>
  <li>Roofing Contractor License - State of Florida</li>
</ul>

<h3>Insurance Coverage</h3>
<ul>
  <li>General Liability: ${GENERAL_LIABILITY} per occurrence / ${GENERAL_LIABILITY_AGGREGATE} aggregate</li>
  <li>Workers Compensation: Statutory limits, all states</li>
  <li>Automobile Liability: ${AUTO_LIABILITY} combined single limit</li>
  <li>Umbrella/Excess Liability: ${UMBRELLA} per occurrence</li>
  <li>Pollution Liability: ${POLLUTION} (for asbestos/environmental work)</li>
</ul>

<h3>Bonding Capacity</h3>
<p>{COMPANY_NAME} maintains bonding capacity through [SURETY_COMPANY] with single project capacity of ${SINGLE_PROJECT_BOND} and aggregate capacity of ${AGGREGATE_BOND}.</p>',
  '["COMPANY_NAME", "GENERAL_LIABILITY", "GENERAL_LIABILITY_AGGREGATE", "AUTO_LIABILITY", "UMBRELLA", "POLLUTION", "SURETY_COMPANY", "SINGLE_PROJECT_BOND", "AGGREGATE_BOND"]',
  ARRAY['certifications', 'licenses', 'insurance', 'bonding', 'SDVOSB'],
  'approved',
  'Phil',
  'Phil',
  NOW(),
  0
),

-- ============================================================================
-- PROJECT MANAGEMENT TEMPLATE
-- ============================================================================

(
  'Project Management Methodology',
  'other',
  '<h2>{COMPANY_NAME} Project Management Approach</h2>

<p>Our project management methodology ensures successful execution through structured planning, clear communication, and proactive problem-solving.</p>

<h3>Phase 1: Mobilization & Planning</h3>
<ul>
  <li>Kickoff meeting with all stakeholders to review project requirements and establish communication protocols</li>
  <li>Development of detailed project schedule with milestones and critical path identification</li>
  <li>Site-specific safety plan and quality control plan submitted for approval</li>
  <li>Procurement of materials and coordination of subcontractors</li>
</ul>

<h3>Phase 2: Execution & Monitoring</h3>
<ul>
  <li>Daily progress reports submitted to Contracting Officer Representative (COR)</li>
  <li>Weekly progress meetings to review schedule, address issues, and coordinate upcoming work</li>
  <li>Continuous quality inspections with photographic documentation</li>
  <li>Proactive identification and resolution of potential delays or conflicts</li>
  <li>Strict compliance with safety protocols and environmental requirements</li>
</ul>

<h3>Phase 3: Closeout & Warranty</h3>
<ul>
  <li>Pre-final inspection walkthrough to identify and correct punch list items</li>
  <li>Final inspection with government representative and third-party testing (if required)</li>
  <li>Submission of complete closeout documentation including as-builts, warranties, and O&M manuals</li>
  <li>Training of facility staff on new systems (if applicable)</li>
  <li>Responsive warranty service for the full warranty period</li>
</ul>',
  '["COMPANY_NAME"]',
  ARRAY['project-management', 'methodology', 'process', 'execution'],
  'approved',
  'Phil',
  'Phil',
  NOW(),
  0
);

-- ============================================================================
-- END OF TEMPLATE SEED DATA
-- ============================================================================
