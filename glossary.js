// Glossary data for the LabLens demo.
// Keys correspond to data-term attributes in the markup.

const GLOSSARY = {
  "hemoglobin": {
    "title": "Hemoglobin",
    "text": "A protein in red blood cells that carries oxygen. Low hemoglobin can cause tiredness or shortness of breath.",
    "action": "Recommendation: Your clinician may check iron or other causes. Consider iron-rich foods and follow-up testing if advised."
  },
  "hematocrit": {
    "title": "Hematocrit",
    "text": "How much of your blood is made up of red blood cells. Low levels can mean your body needs more iron.",
    "action": "Recommendation: If slightly low, dietary changes (iron-rich foods) or a simple iron test (ferritin) are common next steps."
  },
  "mcv": {
    "title": "MCV (mean corpuscular volume)",
    "text": "Average size of your red blood cells. Smaller-than-normal cells often suggest low iron or long-term loss of iron.",
    "action": "Recommendation: A ferritin test checks iron stores; your clinician can advise about supplements if needed."
  },
  "mch": {
    "title": "MCH (mean corpuscular hemoglobin)",
    "text": "Average amount of hemoglobin inside a red blood cell. Low values often track with small cells and low iron.",
    "action": "Recommendation: If low, your provider may look at iron studies or dietary intake."
  },
  "mchc": {
    "title": "MCHC (mean corpuscular hemoglobin concentration)",
    "text": "Average concentration of hemoglobin in red cells. This helps show how 'full' red cells are with hemoglobin.",
    "action": "Recommendation: Usually interpreted with other red cell measurements; discuss with your clinician if abnormal."
  },
  "rdw": {
    "title": "RDW (red cell distribution width)",
    "text": "A measure of variability in red blood cell size. Higher RDW means more variation between cells and can accompany iron issues.",
    "action": "Recommendation: When high with low MCV, clinicians often check iron studies and review causes of anemia."
  },

  // bubble-specific keyed messages (these are used for the value-bubble hover)
  "hemoglobin-value": {
    "title": "Hemoglobin — Status",
    "text_normal": "Totally normal — your hemoglobin is within the expected range.",
    "text_warning": "Slightly low. Not usually an immediate danger; consider iron-rich foods and check ferritin with your provider."
  },
  "hematocrit-value": {
    "title": "Hematocrit — Status",
    "text_normal": "Totally normal — your hematocrit is within expected limits.",
    "text_warning": "Slightly below normal. Often related to iron; your clinician may check iron studies if it stays low."
  },
  "mcv-value": {
    "title": "MCV — Status",
    "text_normal": "Average red cell size is normal.",
    "text_warning": "Smaller-than-normal red cells. Often indicates low iron; consider discussing iron status with your clinician."
  },
  "mch-value": {
    "title": "MCH — Status",
    "text_normal": "MCH within expected range.",
    "text_warning": "Lower-than-expected MCH, commonly seen with small red blood cells and low iron."
  },
  "mchc-value": {
    "title": "MCHC — Status",
    "text_normal": "MCHC is within the normal range.",
    "text_warning": "Slightly outside expected range; usually interpreted with other red cell tests."
  },
  "rdw-value": {
    "title": "RDW — Status",
    "text_normal": "RDW within expected limits.",
    "text_warning": "Higher-than-normal RDW indicates variability in cell sizes; often checked with iron studies."
  }
};