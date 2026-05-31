$ErrorActionPreference = "Stop"

$outDir = Join-Path (Get-Location) "docs\user-guides"
$outFile = Join-Path $outDir "greennest-role-user-guides.docx"
$tmp = Join-Path $env:TEMP ("greennest-role-guides-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $tmp "_rels") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $tmp "docProps") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $tmp "word") | Out-Null

function Escape-Xml([string]$value) {
  if ($null -eq $value) {
    return ""
  }

  return [System.Security.SecurityElement]::Escape($value)
}

function Paragraph([string]$text, [string]$style = "") {
  $escaped = Escape-Xml $text
  $styleXml = if ($style) { "<w:pPr><w:pStyle w:val=""$style""/></w:pPr>" } else { "" }

  return "<w:p>$styleXml<w:r><w:t xml:space=""preserve"">$escaped</w:t></w:r></w:p>"
}

function Cell([string]$text, [bool]$header = $false) {
  $fill = if ($header) { "<w:shd w:fill=""E2F0D9""/>" } else { "" }
  $bold = if ($header) { "<w:b/>" } else { "" }
  $paragraphs = foreach ($line in ($text -split "`n")) {
    "<w:p><w:r><w:rPr>$bold</w:rPr><w:t xml:space=""preserve"">$(Escape-Xml $line)</w:t></w:r></w:p>"
  }
  $body = $paragraphs -join ""

  return "<w:tc><w:tcPr><w:tcW w:w=""2400"" w:type=""dxa""/>$fill</w:tcPr>$body</w:tc>"
}

function Row([string[]]$cells, [bool]$header = $false) {
  $body = ($cells | ForEach-Object { Cell $_ $header }) -join ""

  return "<w:tr>$body</w:tr>"
}

$guides = @(
  [pscustomobject]@{ Role = "chu_tich"; Workspace = "/command-center"; Purpose = "Business chairman for executive oversight, sensitive finance, approvals, decisions, risk, and meetings."; DailyFlow = "Use Command Center and leadership views to review portfolio status, approvals, risks, meetings, decisions, finance-sensitive signals, and AI-confirmable business actions."; Allowed = "Executive/business permissions across project, task, document, legal, meeting, decision, proposal approval, finance view/approval, risk/audit view, and AI insight/action confirmation."; Limits = "No BO/system administration: no settings, users, role catalog, delegation management, source registry, or AI provider configuration." },
  [pscustomobject]@{ Role = "super_admin"; Workspace = "/command-center"; Purpose = "Emergency technical owner and full system administrator."; DailyFlow = "Start from Command Center, then use BO/Admin menu to validate settings, users, roles, audit, AI/provider configuration, and system-wide data integrity."; Allowed = "All permissions across projects, tasks, documents, legal, meetings, knowledge, reports, design, construction, finance, users, settings, audit, and AI."; Limits = "No functional limit in current permission model. Use only for system ownership, emergency support, and final troubleshooting." },
  [pscustomobject]@{ Role = "admin"; Workspace = "/admin"; Purpose = "Operational system administrator for configuration, users, roles, and baseline data."; DailyFlow = "Manage users, assign roles, review settings, check audit trails, support project teams, and maintain operational data."; Allowed = "Broad administration across project/task/document/legal/meeting/report/knowledge/settings/audit/AI. Can invite users and update roles."; Limits = "Finance create/update/approve and payment approval are intentionally excluded." },
  [pscustomobject]@{ Role = "tong_giam_doc"; Workspace = "/executive"; Purpose = "Company-level executive oversight and approval."; DailyFlow = "Open Executive dashboard, review project portfolio, check overdue work, review legal/finance risks, approve high-level decisions, and confirm AI-proposed actions when appropriate."; Allowed = "Create/update/archive projects, assign members, manage tasks, meetings, decisions, reports, legal approvals, knowledge, finance/payment approvals, audit view, AI insight/action confirmation."; Limits = "Document/design/construction are primarily view-level in current model." },
  [pscustomobject]@{ Role = "pho_tong_giam_doc"; Workspace = "/executive"; Purpose = "Executive oversight for assigned business domains or projects."; DailyFlow = "Monitor assigned portfolio, review blockers, create management tasks, track legal and reporting status, and confirm AI proposals when authorized."; Allowed = "Create/update projects and tasks, archive tasks, manage meetings/decisions/reports/knowledge, approve legal and decisions, view finance/audit/design/construction, use AI insight and confirm actions."; Limits = "No project archive/member assignment; finance is view-only." },
  [pscustomobject]@{ Role = "giam_doc_du_an"; Workspace = "/project-workbench"; Purpose = "End-to-end owner of project execution."; DailyFlow = "Review project dashboard, assign team work, monitor documents/legal/tasks, run meetings, create reports, coordinate design and construction updates."; Allowed = "Create/update/archive projects, assign members, manage tasks, documents, meetings, reports, design, construction, knowledge, view finance/audit, use AI insight/action confirmation."; Limits = "No legal approval in current model; finance is view-only." },
  [pscustomobject]@{ Role = "quan_ly_du_an"; Workspace = "/project-workbench"; Purpose = "Day-to-day project manager."; DailyFlow = "Create and update tasks, follow deadlines, coordinate documents/legal status, run meetings, update reports, and monitor delivery risks."; Allowed = "Create/update projects, tasks, documents, legal steps, meetings, decisions, knowledge, reports, design, construction; view finance/audit; use AI insight."; Limits = "No project archive/member assignment, no approval authority for decisions/legal/finance." },
  [pscustomobject]@{ Role = "to_truong"; Workspace = "/team-workbench"; Purpose = "Team lead for assigned packages or field execution."; DailyFlow = "Open team workbench, check own/assigned tasks, update task status, add site diary or quality updates, and view project documents needed for execution."; Allowed = "View project/task/document/meeting/knowledge/report/design/construction, create tasks, update own tasks, update construction, create site diary, update quality, use AI ask."; Limits = "Cannot update all tasks, documents, legal, finance, users, settings, or approvals." },
  [pscustomobject]@{ Role = "phap_ly"; Workspace = "/legal-workspace"; Purpose = "Legal checklist, authority response, and legal document owner."; DailyFlow = "Review legal workspace, update legal checklist, create legal follow-up tasks, maintain documents, track meetings, and prepare legal reports/knowledge."; Allowed = "View project/task/document/legal/meeting/knowledge/report, create tasks, update own tasks, create/update documents, update/approve legal, create meetings, manage knowledge, use AI insight."; Limits = "No project management changes, no finance/design/construction mutation." },
  [pscustomobject]@{ Role = "ke_toan"; Workspace = "/finance-workspace"; Purpose = "Finance, payment, cost, and contract control."; DailyFlow = "Review finance workspace, monitor project financial records, create payment requests, approve payments if authorized, check audit/report data."; Allowed = "View project/task/document/finance/audit/knowledge/report, create tasks, update own tasks, create/update/approve finance, request/approve payments, manage knowledge, use AI insight."; Limits = "No project/document/legal/design/construction mutation beyond own tasks." },
  [pscustomobject]@{ Role = "thiet_ke"; Workspace = "/design-workspace"; Purpose = "Design package, drawings, reviews, and design changes."; DailyFlow = "Open design workspace, review design tasks, update documents/drawings, review design changes, coordinate legal/document dependencies."; Allowed = "View project/task/document/legal/meeting/knowledge/design/audit/report, create tasks, update own tasks, create/update documents, create/update/review/approve design changes, use AI insight."; Limits = "No finance, construction mutation, user/settings, or broad project administration." },
  [pscustomobject]@{ Role = "ky_thuat"; Workspace = "/technical-workspace"; Purpose = "Technical coordination, quality, and technical documentation."; DailyFlow = "Review technical workspace, update technical documents, check design/construction quality items, and manage assigned task progress."; Allowed = "View project/task/document/legal/meeting/knowledge/design/construction/audit/report, create tasks, update own tasks, create/update documents, update design, update quality, use AI ask."; Limits = "No approvals, finance mutation, user/settings, or broad project management changes." },
  [pscustomobject]@{ Role = "thi_cong"; Workspace = "/construction-workspace"; Purpose = "Site execution, field diary, construction quality, and acceptance support."; DailyFlow = "Open construction workspace, update site tasks, add field diary/quality updates, upload relevant documents, and monitor design/construction instructions."; Allowed = "View project/task/document/meeting/knowledge/design/construction/audit/report, create tasks, update own tasks, create/update documents, update construction, create site diary, update quality, use AI ask."; Limits = "No legal, finance, settings, users, or formal approval rights." },
  [pscustomobject]@{ Role = "mua_hang"; Workspace = "/project-workbench"; Purpose = "Procurement, material, and supplier coordination."; DailyFlow = "Review procurement-related tasks, create follow-up tasks, maintain procurement documents, monitor finance visibility, and coordinate with project team."; Allowed = "View project/task/document/meeting/knowledge/construction/finance/audit/report, create tasks, update own tasks, create/update documents, use AI ask."; Limits = "No finance mutation, approvals, legal/design mutation, users, or settings." },
  [pscustomobject]@{ Role = "thu_ky_tro_ly"; Workspace = "/assistant-workspace"; Purpose = "Assistant role for data entry, meetings, documents, and reporting support."; DailyFlow = "Prepare meetings, create decisions/tasks, update documents/legal entries, support reports, and keep project records complete."; Allowed = "View project/task/document/legal/meeting/knowledge/report/design/construction, create/update tasks, create/update documents, update legal, create/update meetings, create decisions/reports, use AI insight."; Limits = "No approvals, finance mutation, user/settings, or project archive/member assignment." },
  [pscustomobject]@{ Role = "kiem_soat_noi_bo"; Workspace = "/admin"; Purpose = "Internal control, audit, compliance, and data review."; DailyFlow = "Review dashboard/audit/portfolio data, compare tasks/documents/legal/finance status, and flag inconsistencies for owners."; Allowed = "Read-only portfolio access to project, task, document, legal, meeting, knowledge, report, design, construction, finance, audit, and AI insight."; Limits = "No create/update/archive/approval permissions in current model." },
  [pscustomobject]@{ Role = "nha_thau"; Workspace = "/contractor"; Purpose = "External contractor portal for assigned work."; DailyFlow = "Open contractor portal, view assigned project context, update own tasks, add construction/site diary updates, and submit documents where required."; Allowed = "Limited external access: view assigned project context, own tasks/documents, meetings, knowledge, reports, design/construction; update own tasks; create documents; update construction; create site diary."; Limits = "Cannot view legal steps, broad internal data, finance, audit, users, settings, or approvals." },
  [pscustomobject]@{ Role = "tu_van"; Workspace = "/consultant"; Purpose = "External consultant portal for assigned review work."; DailyFlow = "Open consultant portal, review assigned documents/design items, update assigned tasks, and provide review input."; Allowed = "Limited external access: view assigned project/task/document/legal/meeting/knowledge/report/design context; update own tasks; create/update documents; review design."; Limits = "Cannot access broad internal portfolio, finance, audit, users, settings, or approval workflows." },
  [pscustomobject]@{ Role = "viewer"; Workspace = "/viewer"; Purpose = "Read-only user for granted project visibility."; DailyFlow = "Open viewer dashboard, inspect project/task/document/legal/meeting/report/design/construction/finance information without changing data."; Allowed = "Read-only access to project, task, document, legal, meeting, knowledge, report, design, construction, and finance within granted scope."; Limits = "No create, update, archive, approval, user, settings, audit, or AI mutation permissions." }
)

$rows = @()
$rows += Row @("Role", "Default workspace", "Purpose", "Daily user guide", "Allowed actions", "Limits") $true
foreach ($guide in $guides) {
  $rows += Row @($guide.Role, $guide.Workspace, $guide.Purpose, $guide.DailyFlow, $guide.Allowed, $guide.Limits)
}

$documentXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
"@
$documentXml += Paragraph "GreenNest BuildFlow - Role-Based User Guides" "Title"
$documentXml += Paragraph "This guide explains how each role should use the software based on the current role and permission model in src/constants/roles.ts and src/lib/permissions/can.ts."
$documentXml += Paragraph "General rule: the UI may hide unavailable actions, but server-side permissions still enforce access. External and read-only users only see data within their granted scope."
$documentXml += "<w:tbl><w:tblPr><w:tblStyle w:val=""TableGrid""/><w:tblW w:w=""0"" w:type=""auto""/><w:tblBorders><w:top w:val=""single"" w:sz=""4""/><w:left w:val=""single"" w:sz=""4""/><w:bottom w:val=""single"" w:sz=""4""/><w:right w:val=""single"" w:sz=""4""/><w:insideH w:val=""single"" w:sz=""4""/><w:insideV w:val=""single"" w:sz=""4""/></w:tblBorders></w:tblPr>"
$documentXml += ($rows -join "")
$documentXml += "</w:tbl>"
$documentXml += Paragraph "Recommended onboarding workflow: start with the default workspace, review assigned projects, check overdue or pending tasks, then use module pages only for actions allowed by the role."
$documentXml += "<w:sectPr><w:pgSz w:w=""16838"" w:h=""11906"" w:orient=""landscape""/><w:pgMar w:top=""720"" w:right=""720"" w:bottom=""720"" w:left=""720"" w:header=""360"" w:footer=""360"" w:gutter=""0""/></w:sectPr></w:body></w:document>"

$contentTypes = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>
"@
$rels = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
"@
$core = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>GreenNest BuildFlow - Role-Based User Guides</dc:title>
  <dc:creator>Codex</dc:creator>
  <cp:lastModifiedBy>Codex</cp:lastModifiedBy>
</cp:coreProperties>
"@
$app = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>GreenNest BuildFlow</Application>
</Properties>
"@

[System.IO.File]::WriteAllText((Join-Path $tmp "[Content_Types].xml"), $contentTypes, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText((Join-Path $tmp "_rels\.rels"), $rels, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText((Join-Path $tmp "docProps\core.xml"), $core, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText((Join-Path $tmp "docProps\app.xml"), $app, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText((Join-Path $tmp "word\document.xml"), $documentXml, [System.Text.UTF8Encoding]::new($false))

if (Test-Path $outFile) {
  Remove-Item -LiteralPath $outFile -Force
}

$zipFile = "$outFile.zip"
if (Test-Path $zipFile) {
  Remove-Item -LiteralPath $zipFile -Force
}

Compress-Archive -Path (Join-Path $tmp "*") -DestinationPath $zipFile -Force
Move-Item -LiteralPath $zipFile -Destination $outFile -Force
Remove-Item -LiteralPath $tmp -Recurse -Force
Get-Item $outFile | Select-Object FullName, Length, LastWriteTime
