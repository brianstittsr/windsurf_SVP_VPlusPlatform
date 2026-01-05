import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/schema";
import { collection, writeBatch, doc, Timestamp } from "firebase/firestore";

const seedTeamMembers = [
  { firstName: "Al", lastName: "Lenac", emailPrimary: "al@manufacftureresults.com", emailSecondary: "albertlenac@gmail.com", mobile: "(973) 723-7448", expertise: "R&D Tax Credits", role: "affiliate", status: "active" },
  { firstName: "Alex", lastName: "West", emailPrimary: "alex@itscnow.com", mobile: "(518) 801-7315", expertise: "Cybersecurity Consulting", role: "affiliate", status: "active" },
  { firstName: "Alysha", lastName: "Campbell", emailPrimary: "alysha@cultureshifthr.com", expertise: "Human Resources", role: "affiliate", status: "active" },
  { firstName: "Brett", lastName: "Heyns", emailPrimary: "brett@getcompoundeffect.com", expertise: "Advanced Marketing/Bus Dev", role: "affiliate", status: "active" },
  { firstName: "Brian", lastName: "Stitt", emailPrimary: "bstitt@strategicvalueplus.com", emailSecondary: "brianstittsr@gmail.com", mobile: "(919) 608-3415", expertise: "Advanced Technology/Robotics", role: "admin", status: "active" },
  { firstName: "Brian", lastName: "McCollough", emailPrimary: "bmccollough@nextstagefl.net", mobile: "(801) 719-0076", expertise: "Operations", role: "affiliate", status: "active" },
  { firstName: "Cass", lastName: "Gibson", emailPrimary: "cassgibson@coststudy.us", emailSecondary: "cass@tapeismoney.com", mobile: "(717) 858-3150", expertise: "Cost Segregation", role: "affiliate", status: "active" },
  { firstName: "Christine", lastName: "Nolan", emailPrimary: "christine.nolan@pines-optimization.com", emailSecondary: "canolan912@gmail.com", mobile: "(215) 808-0035", expertise: "Inventory/Supply Chain", role: "affiliate", status: "active" },
  { firstName: "Daniel", lastName: "Sternklar", emailPrimary: "linkedin@view3d.tv", mobile: "(301) 576-6176", expertise: "Learning Platforms/Metaverses", role: "affiliate", status: "active" },
  { firstName: "Dave", lastName: "McFarland", emailPrimary: "dmcfarland@strategicvalueplus.com", emailSecondary: "dave@focusopex.com", mobile: "(217) 377-2234", expertise: "Operations/Finance", role: "team", status: "active" },
  { firstName: "Dave", lastName: "Myers", emailPrimary: "dave@dmdigi.io", expertise: "Marketing/Branding", role: "affiliate", status: "active" },
  { firstName: "David", lastName: "McFeeters-Krone", emailPrimary: "dmk@intelassets.com", expertise: "Intellectual Property", role: "affiliate", status: "active" },
  { firstName: "David", lastName: "Ziton", emailPrimary: "dziton@victory-as.com", expertise: "IT/CPA", role: "affiliate", status: "active" },
  { firstName: "Ed", lastName: "Porter", emailPrimary: "edport21@gmail.com", expertise: "Chief Revenue Officer", role: "affiliate", status: "active" },
  { firstName: "Elizabeth", lastName: "Wu", emailPrimary: "elizabeth@edd-i.com", mobile: "(404) 706-4854", expertise: "Cybergovernance for Executives", role: "affiliate", status: "active" },
  { firstName: "Gina", lastName: "Tabasso", emailPrimary: "gina@barracudab2b.com", emailSecondary: "gina.tabasso@gmail.com", mobile: "(330) 421-9185", expertise: "Project Management/Ops/Six Sigma", role: "affiliate", status: "active" },
  { firstName: "Icy", lastName: "Williams", emailPrimary: "info@legacy83business.com", mobile: "(513) 335-1978", expertise: "Executive Consulting", role: "affiliate", status: "active" },
  { firstName: "Jeremy", lastName: "Schumacher", emailPrimary: "jeremyrks@gmail.com", expertise: "CIO/Privacy", role: "affiliate", status: "active" },
  { firstName: "John", lastName: "Kloian", emailPrimary: "john@specdyn.com", emailSecondary: "john.kloian@gmail.com", expertise: "Chief Revenue Officer/Gap Assessments", role: "affiliate", status: "active" },
  { firstName: "Jose Luis", lastName: "Ferandez", emailPrimary: "joseluisfernandez88@gmail.com", emailSecondary: "josefernandez@salesfyconsulting.com", expertise: "Executive AI Training/Coaching", role: "affiliate", status: "active" },
  { firstName: "Justice", lastName: "Darko", emailPrimary: "jdarko@strategicvalueplus.com", expertise: "Project Management/Ops/Six Sigma", role: "team", status: "active" },
  { firstName: "Karena", lastName: "Bell", emailPrimary: "karena@profitlinz.com", mobile: "843-804-7151", expertise: "Financial Trouble-Shooter/Strategist/Problem Solver", role: "affiliate", status: "active" },
  { firstName: "Kham", lastName: "Inthirath", emailPrimary: "kham@getcompoundeffect.com", mobile: "(617) 275-8908", expertise: "Marketing/Change Management/AI", role: "affiliate", status: "active" },
  { firstName: "L. Joe", lastName: "Minor", emailPrimary: "joeandlorie84@live.com", expertise: "Shop Operations", role: "affiliate", status: "active" },
  { firstName: "Leonard", lastName: "Fom", emailPrimary: "leonard@finops-squad.com", emailSecondary: "leonard_fom@hotmail.com", mobile: "7789223555", expertise: "CFO/Financial Strategies/Access to Capital", role: "affiliate", status: "active" },
  { firstName: "Maria", lastName: "Perez", emailPrimary: "maria@causemarketingconsultant.com", mobile: "(702) 245-7220", expertise: "Cause Marketing", role: "affiliate", status: "active" },
  { firstName: "Mark", lastName: "Osborne", emailPrimary: "mark@ModernRevenueStrategies.com", mobile: "(404) 808-7625", expertise: "Advanced Marketing/Bus Dev", role: "affiliate", status: "active" },
  { firstName: "Michael", lastName: "Dill", emailPrimary: "michael@dillandassociates.com", mobile: "(919) 637-6099", expertise: "Lean Six Sigma/Operations", role: "affiliate", status: "active" },
  { firstName: "Mike", lastName: "Liu", emailPrimary: "mike@freefuse.com", mobile: "(818)-324-0538", expertise: "Multimedia User-Defined Learning Platforms", role: "affiliate", status: "active" },
  { firstName: "Nate", lastName: "Hallums", emailPrimary: "nhallums@strategicvalueplus.com", emailSecondary: "nate@backyardfishingagency.co", mobile: "(523) 273-7789", expertise: "Net-No-Cost Wellness Plans that Generate Cash Flow", role: "team", status: "active" },
  { firstName: "Nathan", lastName: "Tyler", emailPrimary: "nathan@nsquared.io", expertise: "Executive Dash Boards", role: "affiliate", status: "active" },
  { firstName: "Nelinia", lastName: "Varenas", emailPrimary: "nelinia@stategicvalueplus.com", emailSecondary: "neliniav@gmail.com", mobile: "(310) 650-0725", expertise: "CEO", role: "admin", status: "active" },
  { firstName: "Nicholas", lastName: "Chiselett", emailPrimary: "nicholas@2bytes.com.au", mobile: "61414247540", expertise: "Construction On-line Stores", role: "affiliate", status: "active" },
  { firstName: "Philip", lastName: "Wolfstein", emailPrimary: "phil@philwolfstein.com", expertise: "Certified Business Broker", role: "affiliate", status: "active" },
  { firstName: "RC", lastName: "Caldwell", emailPrimary: "rc@CaldwellLeanSixSigma.com", mobile: "(937) 367-6743", expertise: "Black Belt Six Sigma/TOC Expert", role: "affiliate", status: "active" },
  { firstName: "Rich", lastName: "Egger", emailPrimary: "rich@richegger.com", mobile: "(919) 795-9896", expertise: "Fractional CFO/M&A", role: "affiliate", status: "active" },
  { firstName: "Robert", lastName: "Goodman", emailPrimary: "robert@rgoodmanconsulting.com", mobile: "(919) 995-0484", expertise: "Fractional CFO", role: "affiliate", status: "active" },
  { firstName: "Russ", lastName: "Feingold", emailPrimary: "russ@feingoldconsulting.com", mobile: "(919) 656-0099", expertise: "Fractional CFO", role: "affiliate", status: "active" },
  { firstName: "Scott", lastName: "Downing", emailPrimary: "scott@downingconsulting.com", mobile: "(919) 637-6099", expertise: "Lean Six Sigma/Operations", role: "affiliate", status: "active" },
  { firstName: "Steve", lastName: "Eungblut", emailPrimary: "steve@sterlingchase.com", mobile: "+44 7711 Ster", expertise: "Sales Transformation", role: "affiliate", status: "active" },
  { firstName: "Tina", lastName: "Corner-Stolz", emailPrimary: "tina@cornerstolz.com", mobile: "(919) 637-6099", expertise: "Lean Six Sigma/Operations", role: "affiliate", status: "active" },
  { firstName: "Tom", lastName: "Deierlein", emailPrimary: "tom@thundercattech.com", mobile: "(703) 981-5555", expertise: "Federal Government Contracting", role: "affiliate", status: "active" },
  { firstName: "Vince", lastName: " 'VMan' Delmonte", emailPrimary: "vince@vincedelmonte.com", expertise: "Fitness/Health Coaching", role: "affiliate", status: "active" },
];

export async function POST() {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const batch = writeBatch(db);
    const collectionRef = collection(db, COLLECTIONS.TEAM_MEMBERS);

    for (const member of seedTeamMembers) {
      const docRef = doc(collectionRef);
      batch.set(docRef, {
        ...member,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${seedTeamMembers.length} team members`,
      count: seedTeamMembers.length,
    });
  } catch (error) {
    console.error("Seed team members error:", error);
    return NextResponse.json({ error: "Failed to seed team members" }, { status: 500 });
  }
}
