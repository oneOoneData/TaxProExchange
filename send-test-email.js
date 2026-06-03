var fs = require("fs");
var https = require("https");
var { createClient } = require("@supabase/supabase-js");

var env = fs.readFileSync(".vercel/.env.development.local", "utf8");
var key = env.match(/SUPABASE_SERVICE_ROLE_KEY="([^"]+)"/)[1];
var resendKey = env.match(/RESEND_API_KEY="([^"]+)"/)[1];
var supabase = createClient("https://rzbfkdicrhdharyzfmul.supabase.co", key);

async function main() {
  var { data: all } = await supabase.from("profiles").select("first_name, public_email").limit(500);
  if (!all) { console.log("No data"); return; }

  var targets = {
    "ahay@haycpas.com":1, "eudo@mavenbrook.com":1, "kirsten@ktm-cpa.com":1,
    "garrett@deardenfinancial.com":1, "cai.lindeman@gmail.com":1, "ken@vitalpractice.com":1,
    "stephenchines@yahoo.com":1, "sahara@coyoteledgers.com":1, "tony@towerstaxes.com":1,
    "britt@brittamaddencpa.com":1, "Benbrackett33@gmail.com":1, "rwsnot@gmail.com":1,
    "taxi_tax06@yahoo.com":1, "ben@benjohns.cpa":1, "adrian@avinascpa.com":1,
    "anthony@goldhawkfinancial.com":1, "andrey@taurustekcpa.com":1, "scott@americantax.com":1,
    "regenfinancialco@gmail.com":1, "scott@taxvanta.com":1, "cody@codycartercpa.com":1,
    "missi.jones@icloud.com":1, "Nicolelbristolea@gmail.com":1, "ray@raymercercpa.com":1,
    "jafor3100@gmail.com":1, "alvin@choycpa.com":1, "jnleppert@gmail.com":1,
    "rod@washausentax.com":1, "chasitylav@outlook.com":1, "pitzel8.daddy@gmail.com":1,
    "katrina.martinez0001@gmail.com":1, "james.ling.cpa@gmail.com":1, "jeff@jeffrochestercpa.com":1,
    "nreiter@structuredplan.com":1, "jrbell@bellbusinessservices.net":1, "cpa@shockleytax.com":1,
    "jenniferb@dashbusinessservices.net":1, "daniel@davconsultingllc.com":1,
    "deblieux@deblieuxcpa.com":1, "bdrileycpa@gmail.com":1, "jennifer@jlawcpa.com":1,
    "brant@quantbookkeeping.net":1, "contact@forefinnadvisory.com":1, "jen@flourishtax.com":1
  };

  var optOut = {};
  var optList = "101datainc@gmail.com,kimbasscpa@gmail.com,reese@mweas.com,tripletyler85@gmail.com,info@francocpa.com,brandon@postilliontax.com,01_input_rustier@icloud.com,waezsattar@gmail.com,kevin@kgtaxgroup.com,eadanchrispine@gmail.com,slavenapaskova@gmail.com,kvanduyse@gmail.com,mikeklar123@gmail.com,andrewk.wadkins@gmail.com,michael.nightingales@gmail.com,fcweaver1@gmail.com,julieballato@gmail.com,chris.gr00ver@gmail.com,bryan.granhold@gmail.com,joeywikoff@gmail.com";
  for (var o of optList.split(",")) { optOut[o.toLowerCase()] = 1; }

  var recipients = [];
  for (var p of all) {
    var email = (p.public_email || "").toLowerCase().trim();
    if (targets[email] && !optOut[email]) {
      recipients.push({ name: p.first_name || "Friend", email: p.public_email });
    }
  }

  console.log("Recipients:", recipients.length);

  // Send test to first person
  var first = recipients[0];
  var emailText = "Hi " + first.name + ",\n\nWe just launched something new on TaxProExchange.\n\nYou already know us as the place where tax professionals connect — whether you are looking for overflow help, building your bench, or finding your next opportunity.\n\nNow we have added a marketplace for buying and selling tax practices.\n\nNo brokers, no commissions, no middleman taking a cut. Just a direct connection between tax pros who are ready for their next chapter and those looking to grow.\n\nIf you have ever thought about:\n- Selling your practice when you are ready to retire\n- Finding a successor who actually understands your clients\n- Buying a practice to expand into a new market\n\nThis is the place to do it.\n\nCheck it out here: https://taxproexchange.com/practices\n\nNo pressure — just wanted you to hear it from us first, as someone who has been part of our community.\n\nBest,\nKoen Van Duyse\nTaxProExchange";

  var payload = JSON.stringify({
    from: "Koen at TaxProExchange <koen@taxproexchange.com>",
    to: first.name + " <" + first.email + ">",
    subject: "We have added a practice marketplace to TaxProExchange",
    text: emailText
  });

  var req = https.request({
    hostname: "api.resend.com",
    path: "/emails",
    method: "POST",
    headers: {
      "Authorization": "Bearer " + resendKey,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload)
    }
  }, function(res) {
    var data = "";
    res.on("data", function(c) { data += c; });
    res.on("end", function() {
      var result = JSON.parse(data);
      if (result.id) {
        console.log("TEST SENT to", first.name, "<" + first.email + ">");
        console.log("ID:", result.id);
        console.log("\nApproved? Reply YES to send to all", recipients.length);
      } else {
        console.log("ERROR:", JSON.stringify(result));
      }
    });
  });
  req.on("error", function(e) { console.log("Error:", e.message); });
  req.write(payload);
  req.end();
}

main();
