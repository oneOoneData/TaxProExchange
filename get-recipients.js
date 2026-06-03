var { createClient } = require("@supabase/supabase-js");
var KEY = "***";
var supabase = createClient("https://rzbfkdicrhdharyzfmul.supabase.co", KEY);

async function main() {
  var { data: all, error } = await supabase
    .from("profiles")
    .select("first_name, public_email")
    .limit(500);

  if (error) { console.log("ERROR:", error.message); return; }
  if (!all || all.length === 0) { console.log("No data"); return; }

  var targets = {
    "ahay@haycpas.com":1, "eudo@mavenbrook.com":1, "kirsten@ktm-cpa.com":1,
    "garrett@deardenfinancial.com":1, "cai.lindeman@gmail.com":1,
    "ken@vitalpractice.com":1, "stephenchines@yahoo.com":1, "sahara@coyoteledgers.com":1,
    "tony@towerstaxes.com":1, "britt@brittamaddencpa.com":1, "Benbrackett33@gmail.com":1,
    "rwsnot@gmail.com":1, "taxi_tax06@yahoo.com":1, "ben@benjohns.cpa":1,
    "adrian@avinascpa.com":1, "anthony@goldhawkfinancial.com":1,
    "andrey@taurustekcpa.com":1, "scott@americantax.com":1, "regenfinancialco@gmail.com":1,
    "scott@taxvanta.com":1, "cody@codycartercpa.com":1,
    "ray@raymercercpa.com":1, "jafor3100@gmail.com":1,
    "alvin@choycpa.com":1, "jnleppert@gmail.com":1, "rod@washausentax.com":1,
    "chasitylav@outlook.com":1, "pitzel8.daddy@gmail.com":1, "katrina.martinez0001@gmail.com":1,
    "james.ling.cpa@gmail.com":1, "jeff@jeffrochestercpa.com":1,
    "nreiter@structuredplan.com":1, "jrbell@bellbusinessservices.net":1,
    "cpa@shockleytax.com":1, "jenniferb@dashbusinessservices.net":1,
    "daniel@davconsultingllc.com":1, "missi.jones@icloud.com":1,
    "deblieux@deblieuxcpa.com":1, "bdrileycpa@gmail.com":1,
    "jennifer@jlawcpa.com":1, "brant@quantbookkeeping.net":1,
    "nicolelbristolea@gmail.com":1, "contact@forefinnadvisory.com":1
  };

  var optOut = {};
  var optList = "101datainc@gmail.com,kimbasscpa@gmail.com,reese@mweas.com,tripletyler85@gmail.com,info@francocpa.com,brandon@postilliontax.com,01_input_rustier@icloud.com,waezsattar@gmail.com,kevin@kgtaxgroup.com,eadanchrispine@gmail.com,slavenapaskova@gmail.com,kvanduyse@gmail.com,mikeklar123@gmail.com,andrewk.wadkins@gmail.com,michael.nightingales@gmail.com,fcweaver1@gmail.com,julieballato@gmail.com,chris.gr00ver@gmail.com,bryan.granhold@gmail.com,joeywikoff@gmail.com";
  for (var o of optList.split(",")) { optOut[o.toLowerCase()] = 1; }

  var sendable = [];
  for (var p of all) {
    var email = (p.public_email || "").toLowerCase().trim();
    if (!email) continue;
    if (targets[email] && !optOut[email]) {
      sendable.push(p);
    }
  }

  console.log("Total profiles with emails:", all.filter(p => p.public_email).length);
  console.log("SENDABLE:", sendable.length);
  console.log("---");
  for (var r of sendable) {
    console.log((r.first_name || "Friend") + " <" + r.public_email + ">");
  }
}

main();
