const CACHE_NAME = 'cert-study-hub-bf7112cf8e';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  // BEGIN GENERATED ASSETS (build.py)
  './fonts/nunito-latin-ext.woff2',
  './fonts/nunito-latin.woff2',
  './fonts/opendyslexic-400.woff2',
  './fonts/opendyslexic-700.woff2',
  './images/avd/azure-files-entra-kerberos.png',
  './images/avd/azure-files-share-settings.png',
  './images/az305-arch/compute-decision-tree.svg',
  './images/az305-arch/data-partitioning-horizontal.png',
  './images/az305-arch/hub-spoke-topology.svg',
  './images/az305-arch/load-balancing-decision-tree.png',
  './images/az305-arch/vm-landing-zone-baseline.png',
  './images/azuresec/ai-services-network-acls-json.png',
  './images/azuresec/ai-services-networking.png',
  './images/azuresec/app-gateway-waf-configure.png',
  './images/azuresec/log-analytics-access-control-mode.png',
  './images/azuresec/monitor-activity-log.png',
  './images/azuresec/rbac-condition-code-editor.png',
  './images/azuresql/auditing-settings.png',
  './images/azuresql/backup-retention-policies.png',
  './images/azuresql/compute-utilization-metrics.png',
  './images/azuresql/elastic-job-executions.png',
  './images/azuresql/failover-group-page.png',
  './images/azuresql/managed-instance-compute-storage.png',
  './images/azuresql/query-performance-insight-top-queries.png',
  './images/data/sql-create-additional-settings.png',
  './images/data/sql-query-editor-join.png',
  './images/data/stream-analytics-output-json.png',
  './images/data/stream-analytics-query.png',
  './images/data/table-storage-add-entity.png',
  './images/defender/sentinel-automated-response.png',
  './images/defender/sentinel-incident-details.png',
  './images/defender/sentinel-incident-queue.png',
  './images/defender/sentinel-logs-kql.png',
  './images/defender/sentinel-rule-scheduling.png',
  './images/entra/pim-activate-role.png',
  './images/intune/auto-enrollment-scope.png',
  './images/intune/create-device-profile.png',
  './images/intune/monitor-dashboard-tiles.png',
  './images/intune/noncompliance-notification.png',
  './images/intune/win32-detection-rule.png',
  './images/m365/agent-registry.png',
  './images/m365/agent-sharing-settings.png',
  './images/m365/copilot-agents-data-access.png',
  './images/m365/m365-admin-center-dashboard.png',
  './images/m365/m365-compare-admin-roles.png',
  './images/m365/m365-usage-dashboard.png',
  './images/portal/backup-vault.png',
  './images/portal/deployment-slots.png',
  './images/portal/invite-guest-user.png',
  './images/portal/nsg-rule.png',
  './images/portal/policy-compliance.png',
  './images/portal/pricing-calculator.png',
  './images/portal/resource-group.png',
  './images/portal/role-assignment.png',
  './images/portal/storage-account.png',
  './images/portal/vm-size.png',
  './images/windowsadmincenter/dns-private-resolver-ruleset-rules.png',
  './images/windowsadmincenter/dns-private-resolver-ruleset-vnet-links.png',
  './images/windowsadmincenter/failover-cluster-manager-drain-roles.png',
  './images/windowsadmincenter/storage-migration-service-cutover-config.png',
  './images/windowsadmincenter/storage-migration-service-transfer-mapping.png',
  './images/windowsadmincenter/vm-insights-map-dependencies.png',
  './images/windowsadmincenter/vm-insights-performance-disks.png',
  './images/windowsadmincenter/wac-hyper-v-host-settings.png',
  './images/windowsadmincenter/wac-vm-memory-settings.png',
  './images/windowsadmincenter/windows-laps-ad-properties-dialog.png',
  './images/windowsadmincenter/windows-laps-event-viewer-password-update.png',
  // END GENERATED ASSETS
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.28.4/babel.min.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        CORE_ASSETS.map((url) =>
          cache.add(new Request(url, { mode: 'no-cors' })).catch(() => {})
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
