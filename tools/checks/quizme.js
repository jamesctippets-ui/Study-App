/* "Quiz me on this setup" (src/js/03c_pg_quizme.js): every generated question is well-formed and its answer
 * agrees with the lab engine for every scenario topology and every sandbox. */
const fs = require('fs');
const path = require('path');

module.exports = ({ E, eq, data, root }) => {
  const read = (f) => fs.readFileSync(path.join(root, 'src/js', f), 'utf8');
  const causes = (file, name) => { const m = new RegExp(`const ${name} = (\\{[\\s\\S]*?\\n\\});`).exec(read(file)); return m ? new Function(`return ${m[1]}`)() : {}; };
  const CAUSES = { vlan: causes('04j_playground_vlan.jsx', 'PG_VLAN_CAUSES'), ipconfig: causes('04i_playground_net.jsx', 'PG_IP_CAUSES'), firewall: causes('04k_playground_firewall.jsx', 'PG_FW_CAUSES'), acl: {} };
  eq(Object.keys(CAUSES.vlan).length > 5, true, 'quizme: the VLAN cause map was found in the screens');

  const sets = {
    ipconfig: (data.ipconfig || []).map((s) => s.topology),
    vlan: (data.vlan || []).map((s) => s.topology).concat([data.vlanSandbox]),
    firewall: (data.firewall || []).map((s) => s.topology).concat([data.firewallSandbox]),
    acl: (data.acl || []).map((s) => s.topology).concat(data.aclSandbox ? [data.aclSandbox] : []),
  };
  // The IP lab's sandbox lives in the screens, so its two-subnet default is rebuilt here.
  sets.ipconfig.push({
    segments: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
    hosts: [{ id: 'pc', name: 'PC', segment: 'a', ip: '192.168.1.10', mask: '255.255.255.0', gateway: '192.168.1.1' }, { id: 'pc2', name: 'PC 2', segment: 'a', ip: '192.168.1.11', mask: '255.255.255.0', gateway: '192.168.1.1' }, { id: 'srv', name: 'Server', segment: 'b', ip: '10.0.0.10', mask: '255.255.255.0', gateway: '10.0.0.1' }],
    routers: [{ id: 'r1', name: 'Router', ifaces: [{ segment: 'a', ip: '192.168.1.1', mask: '255.255.255.0' }, { segment: 'b', ip: '10.0.0.1', mask: '255.255.255.0' }], routes: [] }],
  });

  Object.keys(sets).forEach((kind) => {
    let produced = 0;
    sets[kind].forEach((topo, ti) => {
      [1, 2, 3, 4, 5, 6, 7].forEach((seed) => {
        let qs;
        try { qs = E.pgQuizBuild(kind, topo, { seed, causes: CAUSES[kind] }); } catch (e) { eq(String(e && e.stack), 'no error', `quizme ${kind} topology ${ti} seed ${seed} threw`); return; }
        produced += qs.length;
        eq(qs.length <= 5, true, `quizme ${kind}/${ti}/${seed}: at most five questions`);
        qs.forEach((q) => {
          const good = q.prompt && q.explain && Array.isArray(q.options) && q.options.length >= 2 && q.options.length <= 5
            && new Set(q.options).size === q.options.length && Number.isInteger(q.correct) && q.correct >= 0 && q.correct < q.options.length;
          eq(!!good, true, `quizme ${kind}/${ti}/${seed}: ${q.id} is well-formed`);
        });
        eq(new Set(qs.map((q) => q.id)).size, qs.length, `quizme ${kind}/${ti}/${seed}: no repeated question`);
      });
    });
    eq(produced > 0, true, `quizme ${kind}: some questions were produced`);
  });

  // Repeatable for a seed, different for another.
  const sb = data.vlanSandbox;
  eq(JSON.stringify(E.pgQuizBuild('vlan', sb, { seed: 9 })), JSON.stringify(E.pgQuizBuild('vlan', sb, { seed: 9 })), 'quizme: the same seed gives the same round');
  eq(E.pgQuizBuild('vlan', sb, { seed: 1, count: 3 }).length <= 3, true, 'quizme: count caps the round');
  eq(E.pgQuizBuild('vlan', sb, { seed: 1 }).length >= 3, true, 'quizme: the VLAN sandbox gives a full round');
  eq(E.pgQuizBuild('firewall', data.firewallSandbox, { seed: 2 }).length >= 3, true, 'quizme: the firewall sandbox gives a full round');
  eq(E.pgQuizBuild('ipconfig', sets.ipconfig[sets.ipconfig.length - 1], { seed: 3 }).length >= 3, true, 'quizme: the IP sandbox gives a full round');
  eq(E.pgQuizBuild('vlan', { switches: [], hosts: [] }, { seed: 1 }), [], 'quizme: an empty network gives no questions');

  // Spot checks against the engine itself.
  const ipSb = sets.ipconfig[sets.ipconfig.length - 1];
  const ping = E.pgQuizBuild('ipconfig', ipSb, { seed: 11, count: 20 }).filter((q) => /^ip-ping-/.test(q.id));
  eq(ping.length > 0, true, 'quizme: the IP sandbox yields ping questions to spot-check');
  ping.forEach((q) => {
    const [, , a, b] = q.id.split('-');
    const r = E.pgPing(ipSb, a, b);
    eq(q.correct === 0, r.verdict === 'success', `quizme: ${q.id} agrees with pgPing`);
  });
  const net = E.pgQuizBuild('ipconfig', ipSb, { seed: 5, count: 20 }).filter((q) => /^ip-net-/.test(q.id));
  eq(net.length > 0, true, 'quizme: the IP sandbox yields subnet questions to spot-check');
  net.forEach((q) => {
    const host = ipSb.hosts.find((h) => q.id === `ip-net-${h.id}`);
    const v = E.pgDeviceView(host, false)[0];
    eq(q.options[q.correct], E.pgSubnetInfo(v.ipN, v.prefix).networkText, `quizme: ${q.id} has the true network address as its answer`);
  });
  const fw = E.pgQuizBuild('firewall', data.firewallSandbox, { seed: 4, count: 20 }).filter((q) => /^fw-conn-/.test(q.id));
  eq(fw.length > 0, true, 'quizme: the firewall sandbox yields connection questions to spot-check');
  fw.forEach((q) => {
    const m = /^fw-conn-([^-]+)-([^-]+)-(tcp|udp)-(\d+)$/.exec(q.id) || /^fw-conn-([^-]+)-(fw-public)-(tcp|udp)-(\d+)$/.exec(q.id);
    const r = E.pgFwTest(data.firewallSandbox, { from: m[1], to: m[2], proto: m[3], port: Number(m[4]) });
    eq(q.correct === 0, r.verdict === 'success', `quizme: ${q.id} agrees with pgFwTest`);
  });
  if (data.aclSandbox) {
    eq(E.pgQuizBuild('acl', data.aclSandbox, { seed: 6 }).length >= 3, true, 'quizme: the ACL sandbox gives a full round');
    const aq = E.pgQuizBuild('acl', data.aclSandbox, { seed: 8, count: 30 }).filter((q) => /^acl-conn-/.test(q.id));
    eq(aq.length > 0, true, 'quizme: the ACL sandbox yields connection questions to spot-check');
    aq.forEach((q) => {
      const m = /^acl-conn-(.+)-(.+)-(tcp|udp|icmp)-(\d+|null)$/.exec(q.id);
      const hosts = data.aclSandbox.hosts.map((h) => h.id);
      // ids may contain dashes: split by matching known host ids
      const from = hosts.find((h) => q.id.startsWith(`acl-conn-${h}-`));
      const rest = q.id.slice(`acl-conn-${from}-`.length);
      const to = hosts.find((h) => rest.startsWith(`${h}-`));
      const [proto, port] = rest.slice(to.length + 1).split('-');
      const r = E.pgAclTest(data.aclSandbox, { from, to, proto, port: port === 'null' ? undefined : Number(port) });
      eq(q.correct === 0, r.verdict === 'success', `quizme: ${q.id} agrees with pgAclTest`);
    });
  }
};
