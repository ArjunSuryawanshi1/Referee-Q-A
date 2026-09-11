import type { GenerationResponse, Question } from "../src/shared/types";
import { validateGeneratedQuestions } from "../src/shared/validation";

const QUESTIONS: Omit<Question, "questionHash">[] = [
  {
    id: "fallback-1",
    teamA: "Team Blue",
    teamB: "Team Red",
    scenario:
      "A Team Red defender slides toward a Team Blue attacker near midfield and makes late contact with the attacker's leg after the ball has moved away. The contact is forceful but the player's leg is low and the attacker can continue after treatment.",
    choices: [
      { id: "A", text: "Direct free kick to Team Blue and caution the Team Red defender for a reckless challenge." },
      { id: "B", text: "Indirect free kick to Team Blue and no disciplinary action because contact was accidental." },
      { id: "C", text: "Direct free kick to Team Blue and send off the Team Red defender for violent conduct." },
      { id: "D", text: "Allow play to continue because the ball had already moved away." }
    ],
    correctChoiceId: "A",
    explanation:
      "The contact is a direct-free-kick offense. The defender acted with disregard for the danger or consequences to the opponent, so the correct disciplinary action is a caution for a reckless challenge.",
    conceptTags: ["Fouls", "Misconduct", "Free Kick Decisions"],
    difficulty: "beginner",
    lawReferences: ["Law 12 - Fouls and Misconduct"],
    mechanicsFocus: "Whistle, indicate the direction of Team Blue's direct free kick, and show the yellow card."
  },
  {
    id: "fallback-2",
    teamA: "Team Green",
    teamB: "Team White",
    scenario:
      "A Team Green midfielder tries to play a through ball. A Team White player standing two yards from the ball deliberately steps in front of the kick before it is taken, blocking the restart.",
    choices: [
      { id: "A", text: "Retake the free kick for Team Green and caution the Team White player for failing to respect the required distance." },
      { id: "B", text: "Award an indirect free kick to Team White because Team Green kicked the ball into an opponent." },
      { id: "C", text: "Allow play to continue because the ball was put into play." },
      { id: "D", text: "Retake the free kick for Team Green with no card because the restart was quick." }
    ],
    correctChoiceId: "A",
    explanation:
      "An opponent who deliberately prevents a free kick being taken from the required distance should be cautioned. The restart is retaken for Team Green.",
    conceptTags: ["Restarts", "Misconduct", "Match Management"],
    difficulty: "beginner",
    lawReferences: ["Law 12 - Fouls and Misconduct", "Law 13 - Free Kicks"],
    mechanicsFocus: "Stop play, manage the required distance, show the yellow card, and restart with Team Green's free kick."
  },
  {
    id: "fallback-3",
    teamA: "Team Black",
    teamB: "Team Yellow",
    scenario:
      "A Team Black attacker is in front of the second-last defender when a teammate shoots. The goalkeeper parries the shot and the ball rebounds directly to that attacker, who kicks it into the goal.",
    choices: [
      { id: "A", text: "Disallow the goal and award an indirect free kick to Team Yellow for an offside offense where the attacker became involved by gaining an advantage from a rebound." },
      { id: "B", text: "Award the goal because the goalkeeper touched the ball before the attacker played it." },
      { id: "C", text: "Disallow the goal and restart with a dropped ball to Team Yellow." },
      { id: "D", text: "Award a direct free kick to Team Yellow because the attacker challenged the goalkeeper." }
    ],
    correctChoiceId: "A",
    explanation:
      "Being in an offside position alone is not an offense, but this attacker became involved by playing a ball that rebounded from the goalkeeper after a teammate's shot. The restart is an indirect free kick.",
    conceptTags: ["Offside", "Restarts", "Assistant Referee Communication"],
    difficulty: "intermediate",
    lawReferences: ["Law 11 - Offside"],
    mechanicsFocus: "Use the AR's information, stop play, and signal an indirect free kick for Team Yellow."
  },
  {
    id: "fallback-4",
    teamA: "Team Orange",
    teamB: "Team Purple",
    scenario:
      "While the ball is in play near the touchline, a Team Orange substitute standing in the technical area throws a water bottle that strikes a Team Purple player on the field.",
    choices: [
      { id: "A", text: "Send off the Team Orange substitute for violent conduct and restart with a direct free kick to Team Purple from where the Team Purple player was struck." },
      { id: "B", text: "Caution the Team Orange substitute and restart with an indirect free kick to Team Purple." },
      { id: "C", text: "Send off the Team Orange substitute for serious foul play and restart with a dropped ball." },
      { id: "D", text: "Remove the substitute from the technical area and restart with a throw-in to Team Purple." }
    ],
    correctChoiceId: "A",
    explanation:
      "The substitute used force against an opponent while not challenging for the ball. That is violent conduct, not serious foul play. Because the object struck a player on the field while the ball was in play, the restart is a direct free kick from the location of the contact.",
    conceptTags: ["Misconduct", "Restarts", "Match Management"],
    difficulty: "advanced",
    lawReferences: ["Law 12 - Fouls and Misconduct"],
    mechanicsFocus: "Stop play strongly, isolate the incident, show the red card, and manage the restart location."
  },
  {
    id: "fallback-5",
    teamA: "Team Navy",
    teamB: "Team Gold",
    scenario:
      "A Team Navy defender holds a Team Gold attacker's shirt just outside the penalty area as the attacker moves toward goal. The attacker keeps balance, breaks free, and has a clear shot from inside the penalty area.",
    choices: [
      { id: "A", text: "Apply advantage, signal and call “Play on!”, then caution the Team Navy defender at the next stoppage if the holding stopped a promising attack." },
      { id: "B", text: "Stop play immediately and award a direct free kick to Team Gold outside the penalty area because all holding must be called at once." },
      { id: "C", text: "Award a penalty kick to Team Gold because the shot came from inside the penalty area." },
      { id: "D", text: "Apply advantage and take no disciplinary action because the attacker got a shot." }
    ],
    correctChoiceId: "A",
    explanation:
      "Advantage is appropriate when Team Gold benefits more from continuing than from the free kick. Misconduct can still be handled at the next stoppage, although advantage can affect some DOGSO/SPA disciplinary outcomes under the Laws.",
    conceptTags: ["Advantage", "DOGSO / SPA", "Misconduct"],
    difficulty: "intermediate",
    lawReferences: ["Law 5 - The Referee", "Law 12 - Fouls and Misconduct"],
    mechanicsFocus: "Use the advantage signal and voice, keep following play, and remember delayed misconduct."
  },
  {
    id: "fallback-6",
    teamA: "Team Maroon",
    teamB: "Team Sky Blue",
    scenario:
      "A Team Sky Blue goalkeeper inside their own penalty area receives a deliberate kick from a teammate and picks the ball up with both hands while no opponent is nearby.",
    choices: [
      { id: "A", text: "Award an indirect free kick to Team Maroon from the goalkeeper's handling location, subject to the goal-area restart rules." },
      { id: "B", text: "Award a penalty kick to Team Maroon because the goalkeeper handled the ball in the penalty area." },
      { id: "C", text: "Allow play to continue because goalkeepers may always use their hands in their own penalty area." },
      { id: "D", text: "Award a direct free kick to Team Maroon and caution the goalkeeper for unsporting behavior." }
    ],
    correctChoiceId: "A",
    explanation:
      "A goalkeeper may not handle the ball after it has been deliberately kicked to them by a teammate. This is an indirect-free-kick offense, not a penalty kick or direct free kick.",
    conceptTags: ["Goalkeeper Rules", "Restarts", "Free Kick Decisions"],
    difficulty: "beginner",
    lawReferences: ["Law 12 - Fouls and Misconduct", "Law 13 - Free Kicks"],
    mechanicsFocus: "Indicate Team Maroon's direction, then raise one arm straight above the head for the indirect free kick."
  },
  {
    id: "fallback-7",
    teamA: "Team Teal",
    teamB: "Team White",
    scenario:
      "A Team White attacker moves past the last defender near the top of the penalty area with the ball under control and only the goalkeeper ahead. A Team Teal defender reaches from behind and clips the attacker's heel before the attacker can shoot.",
    choices: [
      { id: "A", text: "Award a direct free kick or penalty kick to Team White depending on the offense location, and send off the Team Teal defender for denying an obvious goal-scoring opportunity." },
      { id: "B", text: "Award a direct free kick to Team White and caution the Team Teal defender for stopping a promising attack." },
      { id: "C", text: "Award an indirect free kick to Team White and caution the Team Teal defender." },
      { id: "D", text: "Apply advantage automatically because Team White had a promising attack." }
    ],
    correctChoiceId: "A",
    explanation:
      "The attacker had control, was moving toward goal, was close enough to goal, and had only the goalkeeper ahead. Those factors point to an obvious goal-scoring opportunity, so the defender is sent off unless a specific Law exception applies.",
    conceptTags: ["DOGSO / SPA", "Misconduct", "Free Kick Decisions"],
    difficulty: "advanced",
    lawReferences: ["Law 12 - Fouls and Misconduct"],
    mechanicsFocus: "Stop play, identify restart location, show the red card, and communicate the reason clearly."
  },
  {
    id: "fallback-8",
    teamA: "Team Silver",
    teamB: "Team Brown",
    scenario:
      "The ball is about to cross the touchline near the assistant referee. A Team Brown defender blocks the referee's view, but the assistant referee has a clear angle and signals that Team Silver last touched the ball.",
    choices: [
      { id: "A", text: "Make eye contact with the assistant referee, accept the information if credible, and award the throw-in to Team Brown." },
      { id: "B", text: "Ignore the assistant referee because the center referee must always make boundary-line decisions alone." },
      { id: "C", text: "Restart with a dropped ball because the referee did not personally see the final touch." },
      { id: "D", text: "Award a corner kick to Team Brown because the ball crossed a boundary line near the assistant referee." }
    ],
    correctChoiceId: "A",
    explanation:
      "The referee remains responsible for the final decision but should use credible information from the assistant referee, especially when the AR has the better angle on a boundary-line decision.",
    conceptTags: ["Assistant Referee Communication", "Restarts", "Match Management"],
    difficulty: "beginner",
    lawReferences: ["Law 5 - The Referee", "Law 6 - The Other Match Officials", "Law 15 - The Throw-in"],
    mechanicsFocus: "Use eye contact, confirm the AR's signal, and indicate the throw-in direction."
  },
  {
    id: "fallback-9",
    teamA: "Team Lime",
    teamB: "Team Gray",
    scenario:
      "A Team Lime attacker falls in the penalty area after moving a leg toward a Team Gray defender who is pulling out of the challenge. The referee has a clear view and sees no contact that causes the fall.",
    choices: [
      { id: "A", text: "Stop play, caution the Team Lime attacker for unsporting behavior for attempting to deceive the referee, and restart with an indirect free kick to Team Gray." },
      { id: "B", text: "Award a penalty kick to Team Lime because the attacker fell in the penalty area." },
      { id: "C", text: "Allow play to continue with no action because no foul occurred." },
      { id: "D", text: "Award a direct free kick to Team Gray because the attacker kicked the defender." }
    ],
    correctChoiceId: "A",
    explanation:
      "When a player attempts to deceive the referee by feigning an offense, the player is cautioned for unsporting behavior. The restart is an indirect free kick to the opposing team.",
    conceptTags: ["Misconduct", "Restarts", "Match Management"],
    difficulty: "intermediate",
    lawReferences: ["Law 12 - Fouls and Misconduct"],
    mechanicsFocus: "Use a clear whistle, show the yellow card, and signal the indirect free kick correctly."
  },
  {
    id: "fallback-10",
    teamA: "Team Pink",
    teamB: "Team Charcoal",
    scenario:
      "Team Charcoal is taking an indirect free kick just outside Team Pink's penalty area. The kicker taps the ball to a teammate, who shoots directly into goal while the referee drops the raised arm before the ball touches a second player.",
    choices: [
      { id: "A", text: "Award the goal because the ball touched a second Team Charcoal player before entering the goal; the referee's arm signal error does not change that the restart requirements were met." },
      { id: "B", text: "Disallow the goal and award a goal kick because every indirect free kick shot directly into goal is invalid." },
      { id: "C", text: "Retake the indirect free kick because the referee lowered the arm early and confused the defense." },
      { id: "D", text: "Award a direct free kick to Team Pink because Team Charcoal used two players on the restart." }
    ],
    correctChoiceId: "A",
    explanation:
      "An indirect free kick can result in a goal if the ball touches another player before entering the goal. The correct mechanic is to keep the arm raised as required, but the second touch satisfies the restart requirement.",
    conceptTags: ["Signals", "Restarts", "Free Kick Decisions"],
    difficulty: "advanced",
    lawReferences: ["Law 13 - Free Kicks"],
    mechanicsFocus: "For an indirect free kick, indicate direction, raise one arm straight above the head, and keep it raised until the Law's condition is met."
  }
];

export function fallbackRound(forbiddenHashes: string[] = []): GenerationResponse {
  const validation = validateGeneratedQuestions({ questions: QUESTIONS }, forbiddenHashes);
  const questions = validation.ok
    ? validation.questions
    : validateGeneratedQuestions({ questions: QUESTIONS }).questions;

  return {
    questions,
    metadata: {
      source: "fallback",
      attempts: 0,
      generatedAt: new Date().toISOString()
    }
  };
}
