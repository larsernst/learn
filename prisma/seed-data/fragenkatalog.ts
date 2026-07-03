// Fragenkatalog 2026 – Betriebssysteme Grundlagen
// Antworten wurden vom Entwickler verfasst aus den Vorlesungsfolieninhalten
// in resources/ (Kapitel 1/2/3_gesamt, Kapitel 2 = E/A, Speicherverwaltung,
// Datensicherung, Kapitel 6 gesamt). Die Quelle jeder Antwort ist in
// `sourceRef` angegeben.

export interface CatalogQuestion {
  id: string;
  courseId?: string;
  chapter: number;
  chapterTitle: string;
  question: string;
  answer: string;
  sourceRef: string;
  confidence?: "high" | "low";
  mcqOptions?: McqOption[];
}

export interface McqOption {
  id: string;
  text: string;
  correct: boolean;
}

export const FRAGENKATALOG: CatalogQuestion[] = [
  // ───────────────────────── Kapitel 1 – Einführung ─────────────────────────
  {
    id: "1-aufgaben-bs",
    chapter: 1,
    chapterTitle: "Einführung",
    mcqOptions: [
      { id: "1-aufgaben-bs-opt-1", text: "Abstraktion des Systems (technische Details verstecken)", correct: true },
      { id: "1-aufgaben-bs-opt-2", text: "Dienste für Anwender und Anwendungsprogramme bereitstellen", correct: true },
      { id: "1-aufgaben-bs-opt-3", text: "Verwaltung der Systemressourcen (Prozesse, Scheduling)", correct: true },
      { id: "1-aufgaben-bs-opt-4", text: "Programmcode in Maschinensprache kompilieren", correct: false },
      { id: "1-aufgaben-bs-opt-5", text: "Webseiten rendern und ausliefern", correct: false },
      { id: "1-aufgaben-bs-opt-6", text: "Datenbanktabellen normalisieren", correct: false },
    ],
    question: "Welche Aufgaben hat ein Betriebssystem?",
    answer:
      "Ein Betriebssystem abstrahiert das System (versteckt technische Details, automatisiert Vorgänge, ermöglicht einfache Bedienung), stellt Dienste für Anwender und Anwendungsprogramme (Programme laden, Prozesse erzeugen, E/A-Operationen, Interprozesskontrolle, Programmierschnittstellen) und verwaltet die Systemressourcen (Koordination und Steuerung von Prozessen, Scheduling, Schutz der systeminternen und verarbeiteten Informationen).",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 1_share.md",
  },
  {
    id: "1-protokolle-dienste",
    chapter: 1,
    chapterTitle: "Einführung",
    question: "Was sind Protokolle und Dienste im BS-Kontext?",
    answer:
      "Im Schichtenmodell sind Dienste die Funktionen, die eine Schicht anbietet, und Protokolle sind die Nutzungsvorschriften, nach denen diese Dienste verwendet werden. Die Schichten kommunizieren über festgelegte Schnittstellen miteinander und rufen Funktionen benachbarter Schichten auf.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 1_share.md",
  },
  {
    id: "1-schichten-modell",
    chapter: 1,
    chapterTitle: "Einführung",
    mcqOptions: [
      { id: "1-schichten-opt-1", text: "Hardware (physisches System)", correct: true },
      { id: "1-schichten-opt-2", text: "Betriebssystemkern (Treiber, Speicher-, Prozessverwaltung)", correct: true },
      { id: "1-schichten-opt-3", text: "Anwendungsschicht (Programme, API, GUI)", correct: true },
      { id: "1-schichten-opt-4", text: "Datenbankschicht (SQL-Engine)", correct: false },
      { id: "1-schichten-opt-5", text: "Cloud-Ebene (Virtualisierungshypervisor)", correct: false },
    ],
    question: "Welche Schichten beinhaltet das Schichten-Modell?",
    answer:
      "Das Schalen-/Schichtenmodell besteht mindestens aus der Hardware (physisches System), dem Betriebssystemkern (Treiber, Speicherverwaltung, Prozessverwaltung) und der Anwendungsschicht (Anwendungsprogramme, Programmierschnittstelle/API, grafische Oberfläche). Mit jeder Schicht wird die Hardware weiter veredelt.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 1_share.md",
  },
  {
    id: "1-deadlock",
    chapter: 1,
    chapterTitle: "Einführung",
    question: "Was ist ein Deadlock?",
    answer:
      "Eine Verklemmung (Deadlock) tritt auf, wenn Prozesse bei konkurrierendem Zugriff auf Ressourcen, die exklusiv nur von einem Prozess benutzt werden sollen, sich gegenseitig blockieren und keiner mehr weiterarbeiten kann. Im Ressourcenzuordnungsgraph äußert sie sich als zyklischer Graph.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "1-deadlock-verhindern",
    chapter: 1,
    chapterTitle: "Einführung",
    question: "Wie kann ein Deadlock verhindert werden?",
    answer:
      "Man vermeidet die Verklemmungsvoraussetzungen, etwa indem nicht exklusiv benötigte Ressourcen nicht gesperrt werden, alle benötigten Ressourcen beim Prozessstart auf einmal angefordert werden (atomare Ressourcenzuteilung), Ressourcen nummeriert und in fester Reihenfolge reserviert werden oder Prozessen Ressourcen weggenommen werden können. Alternativ kann das System Verklemmungen ignorieren (Vogel-Strauß-Algorithmus) oder sie regelmäßig erkennen und durch Terminierung/Ressourcenwegnahme beheben.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "1-mikrokern-kommunikation",
    chapter: 1,
    chapterTitle: "Einführung",
    question: "Wie kommunizieren Mikro-Kern-Systeme?",
    answer:
      "Mikrokern-Systeme haben einen modularen Aufbau, der die Systemdienste in separate Programme (Server-Prozesse) aufteilt. Diese kommunizieren über IPC-Mechanismen (Interprozesskommunikation) miteinander; der Microkern selbst setzt direkt an der Hardware an und vermittelt über Hardware-Traps.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 1_share.md",
  },
  {
    id: "1-traps-vs-interrupts",
    chapter: 1,
    chapterTitle: "Einführung",
    mcqOptions: [
      { id: "1-traps-opt-1", text: "Traps sind synchrone, durch das Programm selbst ausgelöste Ereignisse (Systemaufrufe, Ausnahmen)", correct: true },
      { id: "1-traps-opt-2", text: "Traps sind immer fehlerhaft und führen zum Programmabbruch", correct: false },
      { id: "1-traps-opt-3", text: "Interrupts werden vom laufenden Programm selbst geplant", correct: false },
      { id: "1-traps-opt-4", text: "Interrupts werden vom Programm selbst durch fehlerhafte Operationen ausgelöst", correct: false },
    ],
    question: "Was ist der Unterschied zwischen Traps und Interrupts?",
    answer:
      "Traps sind synchrone Ereignisse, die durch das laufende Programm selbst ausgelöst werden (z. B. Systemaufrufe oder Ausnahmen) und den Einsprung ins Betriebssystem im Systemmodus bewirken. Interrupts sind asynchrone Ereignisse, die von außen kommen (Hardware, Timer, E/A-Gerät) und den aktuellen Prozess unterbrechen, ohne vom Programmfluss abzuhängen.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "1-nutzungskonzepte-abstraktion",
    chapter: 1,
    chapterTitle: "Einführung",
    mcqOptions: [
      { id: "1-nutzkonz-opt-1", text: "Prozess-Konzept", correct: true },
      { id: "1-nutzkonz-opt-2", text: "Datei-Konzept", correct: true },
      { id: "1-nutzkonz-opt-3", text: "Speicher-Konzept", correct: true },
      { id: "1-nutzkonz-opt-4", text: "Netzwerk-Routing-Konzept", correct: false },
      { id: "1-nutzkonz-opt-5", text: "Benutzeroberflächen-Konzept", correct: false },
      { id: "1-nutzkonz-opt-6", text: "Compilierungs-Konzept", correct: false },
    ],
    question:
      "Welche drei Nutzungskonzepte werden bei der Abstraktion von Systemen verfolgt?",
    answer:
      "Bei der Abstraktion werden drei Nutzungskonzepte definiert: das Prozess-Konzept, das Datei-Konzept und das Speicher-Konzept. Zusammen mit standardisierten Ein-/Ausgabeschnittstellen und vordefinierten, geräteunabhängigen Diensten ermöglichen sie eine einfache Nutzung der Systemressourcen.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 1_share.md",
  },
  {
    id: "1-api-zweck",
    chapter: 1,
    chapterTitle: "Einführung",
    question: "Was ist der Zweck einer API?",
    answer:
      "Eine Application Programming Interface (API) ist ein von Software zur Verfügung gestellter Programmteil bzw. eine Programmierschnittstelle (meist auf Quelltextebene). Sie erlaubt die wiederkehrende Nutzung von Schnittstellen in unterschiedlichen Programmen und gibt Anwendungen Zugriff auf vom Betriebssystem bereitgestellte Funktionalitäten wie Lesen und Schreiben.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 1_share.md",
  },

  // ──────────────────── Kapitel 2 – Prozesse und Threads ────────────────────
  {
    id: "2-hauptmerkmale-prozess",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question: "Was sind die Hauptmerkmale eines Prozesses?",
    answer:
      "Prozesse sind die aktiven Komponenten eines Systems, können voneinander abhängen, besitzen einen eigenen Adressraum und einen virtuellen Prozessor, benutzen und benötigen Ressourcen sowie einen Speicherbereich für Programmcode, Daten und Stack, und haben einen Vaterprozess sowie ggf. Kindprozesse. Sie durchlaufen einen vorgegebenen Lebenszyklus.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-prozesszustaende",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    mcqOptions: [
      { id: "2-zust-opt-1", text: "Bereit (waiting for CPU)", correct: true },
      { id: "2-zust-opt-2", text: "Laufend/Aktiv (currently executing)", correct: true },
      { id: "2-zust-opt-3", text: "Blockiert/Wartend (waiting for event)", correct: true },
      { id: "2-zust-opt-4", text: "Anonym (noch nicht zugewiesen)", correct: false },
      { id: "2-zust-opt-5", text: "Virtualisiert (in einer VM ausgeführt)", correct: false },
    ],
    question: "Welche Zustände kann ein Prozess einnehmen?",
    answer:
      "Ein Prozess hat stets einen festgelegten Zustand. Das erweiterte Prozessmodell unterscheidet u. a. die Zustände „bereit“, „laufend/aktiv“, „blockiert/wartend“ sowie (je nach Modell) „erzeugt“ und „terminiert“. Zustandsübergänge erfolgen durch Kontextwechsel (Zustandsübergänge).",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-prozesszustand-aussagen",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question: "Was sagt jeder Prozesszustand aus?",
    answer:
      "„Erzeugt“ meint, dass die Prozesskennung zugewiesen und der Kontrollblock initialisiert wird. „Bereit“ heißt, der Prozess wartet auf die Prozessorzuteilung. „Laufend/aktiv“ bedeutet, er ist gerade auf der CPU in Ausführung. „Blockiert/wartend“ heißt, er wartet auf ein Ereignis (z. B. E/A) und kann nicht weiterrechnen. „Terminiert“ bedeutet, der Prozess wurde beendet und seine Ressourcen freigegeben.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-prozesse-verwaltet-ueber",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question: "Worüber werden Prozesse vom Betriebssystem verwaltet?",
    answer:
      "Prozesse werden über die Prozesstabelle verwaltet, die pro Prozess einen Eintrag enthält. Jeder Eintrag hält den Prozesskontrollblock (PCB) mit allen Metadaten des Prozesses. Die Einträge werden zu zustandsabhängigen Warteschlangen verkettet, aus denen der Scheduler auswählt.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-kontextwechsel-ursachen",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question: "Welche Ursachen für einen Kontextwechsel existieren?",
    answer:
      "Ein Kontextwechsel kann durch synchrone Ereignisse (Systemaufruf, Ausnahme/interner Fehler) und durch asynchrone Ereignisse (Interrupts, z. B. Timer, E/A-Gerät) ausgelöst werden. Auch die reguläre Beendigung eines Prozesses (Befehlszähler am Ende, Fehler) führt zu einem Wechsel.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-programmspeicher-inhalte",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question: "Was beinhaltet der Programmspeicher eines Prozesses?",
    answer:
      "Der Programmspeicher enthält den auszuführenden Code des Prozesses (die Maschinenbefehle) und ist in einem geschützten Speicherbereich abgelegt, damit andere Prozesse ihn nicht verändern können. Daneben gehören Daten und ein Stack zum Speicherbild des Prozesses.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-kernel-vs-user-mode",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question: "Was unterscheidet den Kernel-Modus vom User-Modus?",
    answer:
      "Im User-Modus nutzt ein Programm nur API-Funktionen und hat keinen direkten Hardwarezugriff. Im Kernel-Modus nutzt das Betriebssystem das System direkt und uneingeschränkt. Die Umschaltung zwischen den Modi erfolgt durch die CPU; Wechsel in den Kernel-Modus entstehen etwa durch Systemaufrufe, Ausnahmen oder Interrupts.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-prozess-startzustand",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question: "Mit welchem Zustand startet ein Prozess immer?",
    answer:
      "Bei seiner Erzeugung wird der Prozesskontrollblock initialisiert und der Prozess in eine Warteschlange eingehängt; er startet also im Zustand „erzeugt“ bzw. „bereit“ und wartet auf die erste Zuteilung durch den Scheduler.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-koop-vs-praemp-scheduling",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    mcqOptions: [
      { id: "2-koop-opt-1", text: "Beim präemptiven Scheduling unterbricht ein Timer-Signal den laufenden Prozess (erzwungene CPU-Abgabe)", correct: true },
      { id: "2-koop-opt-2", text: "Beim kooperativen Scheduling entscheidet der Scheduler, wann ein Prozess die CPU abgibt", correct: false },
      { id: "2-koop-opt-3", text: "Präemptives Scheduling kann nur auf Mehrprozessorsystemen eingesetzt werden", correct: false },
      { id: "2-koop-opt-4", text: "Beide Verfahren sind identisch – der Unterschied ist historisch", correct: false },
    ],
    question:
      "Was unterscheidet kooperative und verdrängende Scheduling-Verfahren?",
    answer:
      "Beim kooperativen Scheduling entscheidet der laufende Prozess selbst, wann er die CPU abgibt (Stapelbetrieb „ein Programm nach dem anderen“). Beim verdrängenden (präemptiven) Scheduling unterbricht ein Timer-Signal den laufenden Prozess; der Scheduler entscheidet über die Unterbrechung und setzt die Verteilung der CPU-Zeit nach vorgegebenen Parametern durch.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-round-robin",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question: "Wie funktioniert das Round-Robin-Verfahren?",
    answer:
      "Beim Round-Robin-Verfahren (Zeitscheibenverfahren) erhält jeder bereite Prozess der Reihe nach eine feste Zeitscheibe (Quantum) auf der CPU. Läuft die Zeit ab, unterbricht ein Timer-Signal den Prozess, der ans Ende der Warteschlange eingereiht wird, und der nächste Prozess ist drankommen. Dieses Vorgehen realisiert präemptives, faire Zeitscheibenscheduling.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-round-robin-risiko",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question: "Welches Risiko birgt das Round-Robin-Verfahren?",
    answer:
      "Wird die Zeitscheibe zu klein gewählt, überwiegt der Verwaltungsaufwand für die häufigen Kontextwechsel die eigentliche Arbeit – die CPU-Leistung sinkt durch ständiges Umschalten. Ist sie zu groß, nähert sich das Verhalten dem Stapelbetrieb, sodass kurze Prozesse auf lange warten und die Antwortzeit steigt.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
    confidence: "low",
  },
  {
    id: "2-prozesskontrollblock-zweck",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question: "Wozu dient der Prozesskontrollblock?",
    answer:
      "Der Prozesskontrollblock (PCB) ist die Datenstruktur des Systemkerns, die alle Metadaten eines Prozesses enthält (Zustand, Registersatz, Speicher- und Gerätebelegung, Statistik). Er „beschreibt den Prozess“ vollständig und ermöglicht dem Betriebssystem, den Prozessorstatus zu sichern und beim Kontextwechsel wiederherzustellen.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-scheduling-ziele",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question: "Welche Ziele werden beim Scheduling verfolgt?",
    answer:
      "Beim Scheduling muss verteilt werden, welche Prozesse wie viel Prozessorzeit bekommen, in welcher Reihenfolge sie bearbeitet werden und nach welchem Schema Prozesse verdrängt werden. Ziel ist eine effiziente, faire und ausreichend schnelle Ressourcennutzung unter Berücksichtigung unterschiedlicher Prozessarten (rechenintensiv vs. E/A-intensiv).",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-prozessdeskriptor-inhalte",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question: "Was beinhaltet der Prozessdeskriptor?",
    answer:
      "Der Prozessdeskriptor (Prozesskontrollblock) ist die Datenstruktur des Systemkerns mit den Metadaten des Prozesses: Prozesskennung, Zustand, Prozessorstatus/Register, Speicher- und Gerätebelegung, Datei-Verweise, Vererbungsbeziehungen sowie statistische Werte. Er wird pro Prozess in der Prozesstabelle gehalten.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-echte-parallelitaet",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    mcqOptions: [
      { id: "2-par-opt-1", text: "Echte Parallelität ist nur auf Mehrprozessorsystemen mit mehreren physischen CPUs möglich", correct: true },
      { id: "2-par-opt-2", text: "Echte Parallelität liegt vor, wenn ein Programm zwei Threads im selben Prozess verwendet", correct: false },
      { id: "2-par-opt-3", text: "Auf einem Einzelprozessorsystem kann echte Parallelität durch präemptives Scheduling erreicht werden", correct: false },
      { id: "2-par-opt-4", text: "Echte Parallelität entsteht automatisch durch Compiler-Optimierungen", correct: false },
    ],
    question: "Was zeichnet echte Parallelität aus?",
    answer:
      "Echte Parallelität ist nur auf Mehrprozessorsystemen möglich: zwei Aktivitäten werden gleichzeitig und kausal unabhängig voneinander auf verschiedenen Prozessoren ausgeführt. Auf einem Einprozessorsystem gibt es hingegen nur simulierte („pseudo“) Parallelität, bei der jeder Prozess nur begrenzte CPU-Zeit erhält.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-nebenlaeufige-prozesse",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question: "Was zeichnet nebenläufige Prozesse aus?",
    answer:
      "Nebenläufig sind Aktivitäten, wenn sie parallel ausgeführt werden können und keine kausalen Abhängigkeiten zwischen ihnen bestehen – sie können zeitlich durchmischt oder echt gleichzeitig ablaufen. Nebenläufigkeit betrifft die Verwaltung mehrerer Prozesse auf einem Prozessor, mehrerer Prozessoren oder verteilter Computersysteme.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-pseudo-parallele-abarbeitung",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question: "Erläutern Sie die Abarbeitung von zwei „pseudo parallelen“ Prozessen!",
    answer:
      "Auf einem Einprozessorsystem wird zu jedem Zeitpunkt nur ein Programm auf der CPU ausgeführt. Jeder Prozess erhält nur eine begrenzte CPU-Zeit; nach Ablauf einer Zeitscheibe unterbricht ein Timer den laufenden Prozess, der Scheduler sichert den Kontext und wählt den anderen Prozess aus. So entstehen sie zeitlich verschachtelt ab und erwecken den Eindruck gleichzeitiger Ausführung.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-distributed-vs-uniform-memory",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question:
      "Welchen Vorteil bietet die Distributed-Memory-Access-Architektur ggü. der Uniform-Memory-Architektur?",
    answer:
      "Die Distributed-Memory-Architektur (NUMA) verwendet lokale Adressräume und ist „einfach“ skalierbar mit hohem Durchsatz, weil jeder Prozessor seinen Speicher schnell erreicht. Bei der UMA-Architektur ist der Zugriff aller Prozessoren auf die Speichermodule gleichförmig, was nur bei kleinen Prozessorzahlen leicht kontrollierbar ist und hohe Netzbandbreite voraussetzt.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-sync-vs-async-kommunikation",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    mcqOptions: [
      { id: "2-sync-opt-1", text: "Synchrone Kommunikation blockiert bei Abbruch der Übertragung; sie ist Standard bei Unix-Systemen", correct: true },
      { id: "2-sync-opt-2", text: "Asynchrone Kommunikation arbeitet immer ohne Pufferspeicher", correct: false },
      { id: "2-sync-opt-3", text: "Asynchrone Kommunikation ist sicherer, weil der Empfänger eine Empfangsbestätigung schicken muss", correct: false },
      { id: "2-sync-opt-4", text: "Synchrone Kommunikation erfordert einen Puffer und verwendet implizite Empfangsbestätigungen", correct: false },
    ],
    question: "Was unterscheidet synchrone und asynchrone Kommunikation?",
    answer:
      "Synchrone Kommunikation liefert die Information direkt und ohne Pufferung, mit impliziter Empfangsbestätigung, und blockiert bei Abbruch der Übertragung; sie ist einfacher zu programmieren und Standard bei Unix-Systemen. Asynchrone Kommunikation muss Nachrichten zwischenspeichern, hat keine sichere Empfangsbestätigung und erzeugt bei Kommunikationsabbruch keine Blockade beim Empfänger.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-pipes",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question: "Erklären Sie die Kommunikation über Pipes!",
    answer:
      "Eine Pipe ist die erste „richtige“ Form der IPC: ein speziell gepufferter Informationskanal mit unidirektionalem Zugriff im Halb-Duplex-Verfahren. Der Prozess bekommt die Umleitung nicht mit, die Synchronisation erfolgt im Kernel, und Pipes sind nur zwischen Prozessen mit gemeinsamen Vorfahren möglich. Typischer Ablauf: Pipe initialisieren, Daten senden, empfangen, Verbindung schließen (und ggf. löschen).",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-multicast-vs-broadcast",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question: "Was unterscheidet Multicast- und Broadcast-Informationen?",
    answer:
      "Bei einer Broadcast-Information geht dieselbe Nachricht an alle Teilnehmer des Kommunikationsnetzes. Bei einer Multicast-Information geht sie nur an eine definierte Untermenge von Empfängern (Gruppe), nicht aber an alle. Multicast ist damit adressatenspezifischer und bandbreitenschonender.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-signal-vs-nachricht",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    mcqOptions: [
      { id: "2-signal-opt-1", text: "Ein Signal trägt nur die Information 'etwas ist passiert', eine Nachricht enthält Datenelemente", correct: true },
      { id: "2-signal-opt-2", text: "Signale sind immer länger als Nachrichten und enthalten Nutzdaten", correct: false },
      { id: "2-signal-opt-3", text: "Nachrichten und Signale sind synonyme Begriffe in der IPC", correct: false },
      { id: "2-signal-opt-4", text: "Signale werden ausschließlich über Pipes übertragen", correct: false },
    ],
    question: "Was unterscheidet ein Signal von einer Nachricht?",
    answer:
      "Ein Signal ist ein kurzes, asynchrones Ereignissignal an einen Prozess (z. B. „unterbrechen“), das nur die Information „etwas ist passiert“ trägt. Eine Nachricht ist ein Datenelement mit Inhalt, das zwischen Prozessen über einen IPC-Mechanismus ausgetauscht wird und mehrere Bytes/Pakete umfassen kann.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-drei-ipc-moeglichkeiten",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    mcqOptions: [
      { id: "2-drei-ipc-moeglichkeiten-opt-1", text: "Kommunikation über Dateien", correct: true },
      { id: "2-drei-ipc-moeglichkeiten-opt-2", text: "Kommunikation über Pipes", correct: true },
      { id: "2-drei-ipc-moeglichkeiten-opt-3", text: "Synchronisation über Monitore/Mutexe", correct: true },
      { id: "2-drei-ipc-moeglichkeiten-opt-4", text: "Kommunikation über den BIOS-Interrupt", correct: false },
      { id: "2-drei-ipc-moeglichkeiten-opt-5", text: "Austausch über den DMA-Controller", correct: false },
      { id: "2-drei-ipc-moeglichkeiten-opt-6", text: "Verständigung über den CPU-Cache", correct: false },
    ],
    question: "Nennen Sie drei Möglichkeiten zur Interprozesskommunikation!",
    answer:
      "Drei IPC-Mechanismen sind: Kommunikation über Dateien (ältester Mechanismus, Zugriff über Sperren), Kommunikation über Pipes (gepufferter Halb-Duplex-Kanal mit Kernel-Synchronisation) sowie Kommunikation über Nachrichten/Signale bzw. Synchronisationsobjekte wie Mutex, Semaphore und Monitore.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-monitor",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question: "Erläutern Sie die Funktionsweise eines Monitors!",
    answer:
      "Ein Monitor ist ein Kontrollkonzept zur Synchronisation: ein als Monitor definierter Bereich im Quellcode, über den der Zugang zu einem kritischen Bereich kontrolliert wird. Prozesse/Threads, die eintreten wollen, werden in eine Monitor-Warteschlange eingereiht und sind dort „blockiert“; die Ausführung erfolgt unter wechselseitigem Ausschluss der Akteure. Der Monitor wird beim Kompilieren erkannt und auf Betriebssystem-Ebene verwaltet.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-sync-kommunikation-risiko",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question: "Welches Risiko birgt synchrone Kommunikation zwischen zwei Prozessen?",
    answer:
      "Da bei synchroner Kommunikation direkt ohne Pufferung zugestellt und auf die Bestätigung gewartet wird, blockiert ein Abbruch der Übertragung den sendenden (und ggf. wartenden) Prozess – die Blockade bleibt until der Transfer gelingt oder scheitert. Dadurch kann ein Prozess stecken bleiben, wenn der Partner nicht antwortet.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-verklemmung-vorbeugen",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question: "Wie kann Verklemmungen in einem System vorgebeugt werden?",
    answer:
      "Man vermeidet die Verklemmungsvoraussetzungen, etwa durch kein Sperren nicht-exklusiv benötigter Ressourcen, durch einmalige Anforderung aller Ressourcen beim Prozessstart (mit Risiko des Verhungerns), durch Nummerierung der Ressourcen und eine feste Reservierungsstrategie oder dadurch, dass Prozesse Ressourcen wegnehmen können. Alternativ: Erkennung durch Zyklustests und Behebung durch Terminierung oder Ressourcenwegnahme.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-erzeuger-verbraucher-problem",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question: "Erläutern Sie das Erzeuger-Verbraucher-Problem!",
    answer:
      "Zwei Prozesse – Erzeuger und Verbraucher – teilen einen Puffer (z. B. Ring-Buffer): Der Erzeuger produziert Daten und legt sie ab, der Verbraucher entnimmt und verarbeitet sie. Probleme sind: Zugriff auf noch nicht produzierte Daten, Ablage in einen schon vollen Speicher und gleichzeitige Speicherzugriffe. zur Vermeidung von Race-Conditions muss der Zugriff auf die gemeinsam genutzte Ressource synchronisiert werden (z. B. über Monitor/Mutex).",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-verklemmung-bedingungen",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question: "Welche Bedingungen führen zu einer Verklemmung in einem System?",
    answer:
      "Verklemmungen treten auf, wenn konkurrierend auf exklusiv benötigte Ressourcen zugegriffen wird und gleichzeitig Bedingungen wie exklusiver Besitz, Belegung und Warten auf weitere Ressourcen, kein Vorzeitiges Abbrechen (Nicht-Unterbrechbarkeit) sowie zirkulares Warten erfüllt sind. Im Ressourcenzuordnungsgraph zeigt sich das als zyklischer Graph.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-atomare-ressourcenzuteilung",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question: "Erklären Sie die Strategie der atomaren Ressourcenzuteilung!",
    answer:
      "Alle vom Prozess benötigten Ressourcen werden auf einmal, idealerweise schon bei Prozessstart, angefordert. Erhält der Prozess die Gesamtheit nicht, bekommt er gar keine und wartet. Damit kann kein Teilen-und-Warten entstehen und ein zirkuläres Blockieren wird verhindert. Nachteil ist das erhöhte Risiko des Verhungerns des Prozesses.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-kernel-vs-user-threads",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question:
      "Was ist der Unterschied zwischen Kernel- und User-Threads?",
    answer:
      "Kernel-Level-Threads (KLT) sind im gesamten Systemkontext bekannt; der Threadkontrollblock wird im Systemkern angelegt und verwaltet, und KLTs können echt parallel auf mehreren Prozessoren laufen – bei Blockade eines Systemaufrufs wird nur der aufrufende KLT blockiert. User-Level-Threads (ULT) sind nur innerhalb des Prozesses bekannt, werden über Threadbibliotheken implementiert; der CPU-Scheduler kennt nur den Prozess, weshalb pro Prozess nur ein ULT aktiv ist und ein Systemaufruf den gesamten Prozess blockiert.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-thread-beispiele",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    mcqOptions: [
      { id: "2-thread-beispiele-opt-1", text: "Kernel-Threads: Linux-Pthreads (über clone())", correct: true },
      { id: "2-thread-beispiele-opt-2", text: "User-Threads: POSIX-User-Thread-Bibliothek", correct: true },
      { id: "2-thread-beispiele-opt-3", text: "Kernel-Threads: Windows-Notepad", correct: false },
      { id: "2-thread-beispiele-opt-4", text: "User-Threads: Festplatten-Sektoren", correct: false },
      { id: "2-thread-beispiele-opt-5", text: "Kernel-Threads: BIOS-POST", correct: false },
    ],
    question: "Nennen Sie je ein Beispiel für Kernel- und User-Threads!",
    answer:
      "Beispiel für Kernel-Level-Threads sind die Threads, die das Betriebssystem direkt verwaltet, etwa Linux-Threads über `clone()`/Pthreads, die der Kernel schedult. Beispiel für User-Level-Threads sind Bibliotheks-Threads, die der Prozess selbst verwaltet, z. B. alte POSIX-Threads-User-Thread-Bibliotheken oder Goroutinen-artige User-Threads, die ohne Kernelkenntnis über eine Threadbibliothek realisiert werden.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
    confidence: "low",
  },
  {
    id: "2-threadkontrollblock-bestandteile",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    mcqOptions: [
      { id: "2-tcb-opt-1", text: "Threadkennung", correct: true },
      { id: "2-tcb-opt-2", text: "Zustand (bereit/laufend/blockiert)", correct: true },
      { id: "2-tcb-opt-3", text: "Gesicherter Registersatz/Prozessorstatus", correct: true },
      { id: "2-tcb-opt-4", text: "Verweis auf den zugehörigen Prozess", correct: true },
      { id: "2-tcb-opt-5", text: "E-Mail-Adresse des Nutzers", correct: false },
      { id: "2-tcb-opt-6", text: "Quellcode der Bibliothek", correct: false },
    ],
    question: "Nennen Sie die Bestandteile eines Threadkontrollblocks!",
    answer:
      "Der Threadkontrollblock hält pro Thread die Informationen, die der Scheduler benötigt: Threadkennung, Zustand (bereit/laufend/blockiert), gesicherter Registersatz/Prozessorstatus (insb. Befehlszähler und Stack-Pointer), Stack-Verwaltungsinformationen sowie Verweise auf den zugehörigen Prozess. er wird – je nach Threadmodell – auf System- oder Programmebene verwaltet.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-multithreading-ziele",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question: "Welche Ziele werden beim Multithreading verfolgt?",
    answer:
      "Multithreading ermöglicht mehrere Kontrollflüsse innerhalb eines Programms, echte Parallelität (Hyper-Threading/Multiprozessor), schnellere Umschaltung zwischen Threads als zwischen Prozessen, gemeinsame Nutzung der Prozessressourcen über mehrere Threads, bessere Ausnutzung der Rechenzeit und kürzere Reaktionszeiten, weil Wartezeiten auf einzelne Threads ausgelagert werden.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-threads-prozesse-verknuepfung",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question: "Wie werden Threads und Prozesse miteinander verknüpft?",
    answer:
      "Threads sind sequenzielle Bestandteile eines Prozesses: mehrere Threads teilen sich den Adressraum, die Programmdaten und Ressourcen ihres Prozesses, besitzen aber jeweils einen eigenen Programmzähler, Stack und Registersatz. Verwaltet werden sie in einer Thread-Tabelle; das Threadmodell (Kernel-/User-Threads bzw. hybride Modelle) bestimmt, wie Threads dem Prozess und dem Scheduler zugeordnet werden.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-prozess-blockiert-umstand",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question: "Welcher Umstand sorgt dafür, dass ein Prozess blockiert wird?",
    answer:
      "Ein Prozess wird blockiert, wenn er auf ein Ereignis warten muss, um weiterarbeiten zu können – typischerweise beim Warten auf eine E/A-Operation, ein Signal, eine Nachricht, einen freien Speicherbereich oder eine gesperrte Ressource. Dabei wird sein Zustand auf „blockiert“ gesetzt und er in eine Warteschlange eingereiht bis das Ereignis eintritt.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-programm-zu-prozess",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question: "Wann wird ein Programm zu einem Prozess?",
    answer:
      "Ein Programm wird zu einem Prozess, wenn es in Ausführung gebracht wird: Das Betriebssystem lädt das Programm, erzeugt eine Prozesskennung, teilt Speicherplatz für Programmcode, Daten und Stack zu, initialisiert den Prozesskontrollblock (Startzustand) und hängt den Prozess in die Warteschlange ein. „Ein Prozess ist ein in Ausführung befindliches Programm.“",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },
  {
    id: "2-prozesstabelle-inhalte",
    chapter: 2,
    chapterTitle: "Prozesse und Threads",
    question: "Ein BS pflegt eine Prozesstabelle. Was ist darin enthalten?",
    answer:
      "Die Prozesstabelle enthält für jeden Prozess einen Eintrag in Form des Prozesskontrollblocks (Prozessdeskriptor): Prozesskennung, Zustand, Registersatz/Prozessorstatus, Speicher- und Gerätebelegung, offene Dateien, Vererbungsbeziehungen und statistische Werte. Über die Verkettung der Einträge zu zustandsabhängigen Listen wählt der Scheduler die Prozesse aus.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md",
  },

  // ───────────────── Kapitel 3 – Ein- und Ausgabegeräte ──────────────────────
  {
    id: "3-polling",
    chapter: 3,
    chapterTitle: "Ein- und Ausgabegeräte",
    question: "Erklären Sie, wie Polling funktioniert!",
    answer:
      "Beim Polling fragt der Rechner zyklisch das BUSY-Bit des Controllers ab (passives Verhalten des Controllers) bis „bereit“ angezeigt wird. Dann überträgt er ein Byte ins Ausgaberegister, setzt das EXECUTE-Bit; der Controller erkennt den Arbeitsauftrag, setzt BUSY, liest das Byte und löst die Ausgabe aus. Anschließend werden EXECUTE-, BUSY- und ERROR-Bit zurückgesetzt. Das Verfahren arbeitet mit Statusbits und ist praktisch ineffizient.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 2_share.md",
  },
  {
    id: "3-polling-vs-interrupt",
    chapter: 3,
    chapterTitle: "Ein- und Ausgabegeräte",
    mcqOptions: [
      { id: "3-poll-opt-1", text: "Beim Polling fragt der Rechner zyklisch das BUSY-Bit des Controllers ab", correct: true },
      { id: "3-poll-opt-2", text: "Polling ist effizienter als Interrupts, weil es keine ISR benötigt", correct: false },
      { id: "3-poll-opt-3", text: "Bei Interrupts fragt der Rechner genauso zyklisch ab; der Unterschied liegt nur im verwendeten Bus-System", correct: false },
      { id: "3-poll-opt-4", text: "Interrupts sind ein anderer Name für die Polling-Methode", correct: false },
    ],
    question:
      "Was ist der Unterschied zwischen Polling und Interrupt-Steuerung?",
    answer:
      "Beim Polling fragt der Rechner zyklisch den Controller ab (passives Verhalten), was CPU-Zeit verbraucht. Bei der Interrupt-Steuerung fragt der Rechner nicht zyklisch ab, sondern der Controller meldet sich selbstständig; darauf wird eine Interrupt Service Routine ausgeführt, andere Interrupts können maskiert werden, und moderne Systeme bieten umfangreiche Kontrollmechanismen (Prioritäten, Nebenläufigkeiten).",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 2_share.md",
  },
  {
    id: "3-geraeteunabhaengige-software",
    chapter: 3,
    chapterTitle: "Ein- und Ausgabegeräte",
    question:
      "Welche Aufgaben hat die geräteunabhängige Software in einem System?",
    answer:
      "Die geräteunabhängige Software führt die vom konkreten E/A-Gerät unabhängigen Aufgaben aus. Ihre Hauptaufgabe ist die einheitliche Darstellung unterschiedlicher E/A-Geräte und Treiber, damit Treiber an einheitlichen Schnittstellen leichter eingebunden werden können (z. B. einheitliche Operationen wie „write“).",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 2_share.md",
  },
  {
    id: "3-treiber-aufgaben",
    chapter: 3,
    chapterTitle: "Ein- und Ausgabegeräte",
    mcqOptions: [
      { id: "3-treiber-aufgaben-opt-1", text: "Geräte eines Typs steuern", correct: true },
      { id: "3-treiber-aufgaben-opt-2", text: "Einheitliche E/A-Schnittstelle bereitstellen", correct: true },
      { id: "3-treiber-aufgaben-opt-3", text: "Ein-/Ausgabeanforderungspakete (IORP) verwalten", correct: true },
      { id: "3-treiber-aufgaben-opt-4", text: "Benutzerpasswörter prüfen", correct: false },
      { id: "3-treiber-aufgaben-opt-5", text: "Netzwerkrouting berechnen", correct: false },
      { id: "3-treiber-aufgaben-opt-6", text: "Festplatten defragmentieren", correct: false },
    ],
    question: "Nennen Sie drei Aufgaben eines Gerätetreibers!",
    answer:
      "Ein Gerätetreiber (1) ist ein Modul des Systemkerns, das ein oder mehrere Geräte desselben Typs kontrolliert, (2) stellt idealerweise eine einheitliche Schnittstelle für sämtliche E/A-Funktionen bereit (z. B. „write“ zum Schreiben in ein Gerät) und (3) verwaltet gerätespezifische Ein-/Ausgabeanforderungspakete (IORP) mit optimierten Verwaltungsalgorithmen; er behandelt zudem Sonderfälle wie das Hinzukommen oder Entfernen eines Geräts.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 2_share.md",
  },
  {
    id: "3-treiber-bestandteile",
    chapter: 3,
    chapterTitle: "Ein- und Ausgabegeräte",
    question: "Aus welchen Bestandteilen besteht ein Gerätetreiber?",
    answer:
      "Ein Gerätetreiber besteht aus controller-/gerätespezifischen Funktionen, die das Gerät steuern, einer einheitlichen Schnittstelle für die E/A-Funktionen nach außen, und Verwaltungseinrichtungen für die Ein-/Ausgabeanforderungspakete (IORP), die alle vom Treiber benötigten Informationen (Geräteadresse, Byteanzahl etc.) in gerätespezifischen Listen halten.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 2_share.md",
  },
  {
    id: "3-dma-strategie",
    chapter: 3,
    chapterTitle: "Ein- und Ausgabegeräte",
    question:
      "Erläutern Sie Funktionsweise und Vorteile einer beliebigen Direct Memory Access-Strategie!",
    answer:
      "Beim DMA delegiert die CPU Übertragungsaufgaben an eine einfache DMA-CPU, sodass die CPU parallel andere Aufgaben erledigen kann. Über einen DMA-Request werden Adresse, Byteanzahl und Hauptspeicherreservierung festgelegt. Beispiel „Single Bus Detached“: alle Module nutzen das Bus-System gemeinsam, die DMA-Einheit wirkt als stellvertretender Prozessor – simpel und billig, aber mit Gefahr eines Flaschenhalses. Vorteile generell: Entlastung der CPU und parallele E/A-Übertragung.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 2_share.md",
  },
  {
    id: "3-block-vs-zeichen-orientiert",
    chapter: 3,
    chapterTitle: "Ein- und Ausgabegeräte",
    question:
      "Worin unterscheiden sich blockorientierte und zeichenorientierte Kommunikation?",
    answer:
      "Blockorientierte Geräte übertragen Daten in ganzen Blöcken fester Größe (z. B. Festplatten); der Zugriff erfolgt blockweise und puffert. Zeichenorientierte Geräte übertragen einzelne Bytes/Zeichen (z. B. Tastatur, serielle Schnittstelle); die Übertragung ist stromorientiert und erfolgt Zeichen für Zeichen. Die Speicherverwaltung und Treiberstruktur unterscheiden sich entsprechend.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 2_share.md",
  },

  // ───────────────────── Kapitel 4 – Speicherverwaltung ─────────────────────
  {
    id: "4-cache-vs-hauptspeicher",
    chapter: 4,
    chapterTitle: "Speicherverwaltung",
    mcqOptions: [
      { id: "4-cache-opt-1", text: "Der Cache ist ein sehr schneller Zwischenspeicher zwischen CPU und Hauptspeicher für häufig genutzte Daten", correct: true },
      { id: "4-cache-opt-2", text: "Der Hauptspeicher ist schneller als der Cache, hat aber eine geringere Kapazität", correct: false },
      { id: "4-cache-opt-3", text: "Cache und Hauptspeicher sind identisch – der Cache ist lediglich eine ältere Bezeichnung", correct: false },
      { id: "4-cache-opt-4", text: "Der Hauptspeicher ist der Zwischenspeicher, der Cache dient als dauerhafter Langzeitspeicher", correct: false },
    ],
    question: "Was unterscheidet Cache-Speicher vom Hauptspeicher?",
    answer:
      "Der Cache ist ein temporärer, sehr schneller Zwischenspeicher zwischen CPU und Hauptspeicher/Festplatten, der häufig verwendete Daten puffert, um Zugriffszeit und Leistung zu verbessern. Der Hauptspeicher (RAM) ist der Arbeitsspeicher mit wahlfreiem Zugriff über die direkte Speicheradresse, größer und etwas langsamer als der Cache, aber Hauptspeicher für ausführbare Programme.",
    sourceRef: "_MConverter.eu_Folien - Speicherverwaltung.md",
  },
  {
    id: "4-ram-rom",
    chapter: 4,
    chapterTitle: "Speicherverwaltung",
    mcqOptions: [
      { id: "4-ramrom-opt-1", text: "RAM (Random Access Memory) ist der flüchtige Arbeitsspeicher mit wahlfreiem Zugriff", correct: true },
      { id: "4-ramrom-opt-2", text: "ROM (Read Only Memory) ist ein dauerhafter Speicher ohne Schreibzugriff, mechanisch austauschbar", correct: true },
      { id: "4-ramrom-opt-3", text: "RAM ist nicht-flüchtig und dient ausschließlich als Cache der CPU", correct: false },
      { id: "4-ramrom-opt-4", text: "ROM ist ein anderer Name für den Arbeitsspeicher des Computers", correct: false },
    ],
    question: "Was bedeuten die Abkürzungen RAM- und ROM-Speicher?",
    answer:
      "RAM (Random Access Memory) ist der Arbeitsspeicher/Hauptspeicher mit wahlfreiem Zugriff über die direkte Speicheradresse, temporär und flüchtig. ROM (Read Only Memory) ist ein dauerhafter Speicher ohne Schreibzugriff, mechanisch austauschbar, der feste Inhalte (z. B. Firmware) dauerhaft bereithält.",
    sourceRef: "_MConverter.eu_Folien - Speicherverwaltung.md",
  },
  {
    id: "4-flash-mehrere-bits",
    chapter: 4,
    chapterTitle: "Speicherverwaltung",
    question:
      "Wie können mit einer Flash-Speicherzelle mehr als ein Bit gespeichert werden? Erläutern Sie die verwendete Technik!",
    answer:
      "Durch Auswertung der Spannung zwischen Drain und Source werden mehrere Zustände innerhalb einer Speicherzelle abgebildet (MLC/TLC-Verfahren): statt nur „0“ und „1“ werden mehrere Spannungsstufen unterschieden, die mehreren Bits je Zelle entsprechen. Umso mehr Zustände, desto günstiger der Speicher; allerdings sinken Lebensdauer und Anzahl der Schreib-/Lesezyklen.",
    sourceRef: "_MConverter.eu_Folien - Speicherverwaltung.md",
  },
  {
    id: "4-drei-aufgaben-speicherverwaltung",
    chapter: 4,
    chapterTitle: "Speicherverwaltung",
    mcqOptions: [
      { id: "4-drei-aufgaben-sv-opt-1", text: "Speicher zuweisen und wieder freigeben", correct: true },
      { id: "4-drei-aufgaben-sv-opt-2", text: "Belegte Speicherbereiche verfolgen", correct: true },
      { id: "4-drei-aufgaben-sv-opt-3", text: "Auslagerung von Speicher auf Festplatte verwalten", correct: true },
      { id: "4-drei-aufgaben-sv-opt-4", text: "Benutzeraccounts anlegen", correct: false },
      { id: "4-drei-aufgaben-sv-opt-5", text: "Grafiktreiber rendern", correct: false },
      { id: "4-drei-aufgaben-sv-opt-6", text: "CPU-Lüfterdrehzahl regeln", correct: false },
    ],
    question: "Nennen Sie drei Aufgaben der Speicherverwaltung!",
    answer:
      "Die Speicherverwaltung (1) verwaltet die Speicherhierarchie und teilt Prozessen Speicher zu und gibt ihn frei, (2) verfolgt, welche Speicherbereiche gerade benutzt werden, und (3) verwaltet die Auslagerung von Speicher auf Festplatte sowie die Umwandlung logischer in physische Adressen (Memory Management Unit). Sie ist physischer und logischer Bestandteil des Prozessors.",
    sourceRef: "_MConverter.eu_Folien - Speicherverwaltung.md",
  },
  {
    id: "4-direkte-vs-dynamische-sv",
    chapter: 4,
    chapterTitle: "Speicherverwaltung",
    question: "Was unterscheidet direkte und dynamische Speicherverwaltung?",
    answer:
      "Bei der direkten (statischen) Speicherverwaltung wird der Hauptspeicher in feste Partitionen gleicher oder unterschiedlicher Größe aufgeteilt; Programme organisieren ihren Platz selbst, ungenutzter Speicherplatz ist verloren bis zur Neuverteilung. Bei der dynamischen Speicherverwaltung (Partitionierung) werden Partitionen variabler Länge und Anzahl erzeugt, die exakt zum Prozess passen – was jedoch zu externer Fragmentierung und nötiger Defragmentierung führt.",
    sourceRef: "_MConverter.eu_Folien - Speicherverwaltung.md",
  },
  {
    id: "4-anforderungen-sv",
    chapter: 4,
    chapterTitle: "Speicherverwaltung",
    question: "Welche Anforderungen werden an eine SV gestellt?",
    answer:
      "An eine Speicherverwaltung werden u. a. gestellt: gemeinsame Nutzung des Hauptspeichers durch mehrere Programme; Auslagerung von Prozessen, wobei Hard-/Software gespeicherte Informationen wiederfinden müssen; Umwandelbarkeit logischer in physische Adressen; Schutz fremder Prozessdaten vor unbefugtem Lesen/Verändern; Ermöglichung geteilten Speichers; Integration modularer Softwarebestandteile in die lineare Speicherstruktur und Transport von Daten zwischen Haupt- und Langzeitspeicher.",
    sourceRef: "_MConverter.eu_Folien - Speicherverwaltung.md",
  },
  {
    id: "4-sv-anforderung-erlaeutern",
    chapter: 4,
    chapterTitle: "Speicherverwaltung",
    question:
      "Erläutern Sie eine beliebige der Ihnen bekannten SV-Anforderungen!",
    answer:
      "Beispiel „Schutz“: Prozessinformationen und -daten liegen nebeneinander im Speicher und dürfen nicht miteinander vermischt werden. Fremde Prozesse sollen nicht in der Lage sein, Informationen anderer Prozesse zu lesen oder zu verändern (außer dies ist gewollt). Die Speicherverwaltung muss diese Isolation zwischen den Adressräumen sicherstellen.",
    sourceRef: "_MConverter.eu_Folien - Speicherverwaltung.md",
  },
  {
    id: "4-paging",
    chapter: 4,
    chapterTitle: "Speicherverwaltung",
    question: "Was verstehen Sie unter Paging?",
    answer:
      "Paging ist ein Prinzip zur Speicherverwaltung: Der Hauptspeicher wird in definiert große Blöcke (Seitenrahmen) aufgeteilt, der logische Adressraum eines Prozesses in gleich große Seiten (Seitengröße = Seitenrahmen). Seiten werden beliebig auf Seitenrahmen verteilt, verwaltet über eine Seitentabelle; die Adresse zerfällt in Seitennummer und Offset (Displacement). Damit lassen sich Programme ausführen, die nicht vollständig im Hauptspeicher geladen sind (Present-Bit, Seitenfehlerbehandlung).",
    sourceRef: "_MConverter.eu_Folien - Speicherverwaltung.md",
  },
  {
    id: "4-hdd-defragmentieren",
    chapter: 4,
    chapterTitle: "Speicherverwaltung",
    mcqOptions: [
      { id: "4-hdd-opt-1", text: "HDD-Festplatten werden defragmentiert, um verstreute belegte Bereiche zusammenzuführen und Zugriffszeiten zu reduzieren", correct: true },
      { id: "4-hdd-opt-2", text: "Eine Defragmentierung erhöht die Gesamtkapazität der Festplatte", correct: false },
      { id: "4-hdd-opt-3", text: "HDDs müssen defragmentiert werden, damit das BS den Lesekopf kalibrieren kann", correct: false },
      { id: "4-hdd-opt-4", text: "Defragmentierung ist nur bei SSDs sinnvoll, bei HDDs entsteht keine Fragmentierung", correct: false },
    ],
    question: "Warum werden HDD-Festplatten defragmentiert?",
    answer:
      "HDD-Festplatten sind magnetbasierend und werden über einen Schreib-/Lesekopf adressiert. Durch Belegung und Freigabe entstehen Lücken; die Defragmentierung schiebt belegte Bereiche zusammen (Speicherkompaktierung), um aus vielen kleinen eine große freie Lücke zu erhalten und Zugriffszeiten zu reduzieren. Sie dient der Rückgewinnung und Reorganisation von Speicherplatz.",
    sourceRef: "_MConverter.eu_Folien - Speicherverwaltung.md",
  },
  {
    id: "4-flash-nicht-defragmentieren",
    chapter: 4,
    chapterTitle: "Speicherverwaltung",
    mcqOptions: [
      { id: "4-flash-opt-1", text: "Flash-Speicher haben eine blockweise Struktur ohne Lesekopf – die physische Lage der Blöcke ist irrelevant", correct: true },
      { id: "4-flash-opt-2", text: "Eine Defragmentierung erhöht dauerhaft die Schreib- und Lesegeschwindigkeit von SSDs", correct: false },
      { id: "4-flash-opt-3", text: "SSDs müssen regelmäßig defragmentiert werden, um die Datenrate zu erhöhen", correct: false },
      { id: "4-flash-opt-4", text: "SSDs werden genauso wie HDDs defragmentiert; es gibt keinen Unterschied", correct: false },
    ],
    question: "Warum sollten Flash-Speichermedien nicht defragmentiert werden?",
    answer:
      "SSDs/Flash-Speicher haben eine blockweise Datenstruktur ohne Lesekopf; die physische Lage der Blöcke ist nicht relevant. Eine Defragmentierung bringt keinen Zugriffsvorteil, verbraucht aber unnötig Lese- und Schreibzyklen und verkürzt damit die Lebensdauer der SSD.",
    sourceRef: "_MConverter.eu_Folien - Speicherverwaltung.md",
  },
  {
    id: "4-fragmentierung-speicher",
    chapter: 4,
    chapterTitle: "Speicherverwaltung",
    question:
      "Erläutern Sie, wie es im Hauptspeicher zur Speicherfragmentierung kommen kann!",
    answer:
      "Durch wiederholte Ein- und Auslagerung von Prozessen mit unterschiedlichem Speicherbedarf entstehen Lücken zwischen belegten Bereichen. Bei dynamischer Partitionierung entsteht externe Fragmentierung (viele zu kleine Lücken, die für keinen neuen Prozess passen). Bei fester Partitionierung entsteht interne Fragmentierung, weil der ungenutzte Platz innerhalb einer zu großen Partition verloren ist.",
    sourceRef: "_MConverter.eu_Folien - Speicherverwaltung.md",
  },
  {
    id: "4-segmentierung-ziel",
    chapter: 4,
    chapterTitle: "Speicherverwaltung",
    question:
      "Welches Ziel wird bei der Segmentierung von Speicher verfolgt?",
    answer:
      "Segmentierung unterteilt den logischen Adressraum eines Prozesses in Segmente unterschiedlicher Größe, die von Anwendung/Compiler festgelegt werden. Ziel ist, verschiedenen Verwendungen (Code, Daten, Stack) unterschiedliche Zugriffsrechte zuzuweisen und die modular-strukturierten Softwarebestandteile trotz linearer Speicherarchitektur verwalten zu können (in der Praxis kombiniert mit Paging).",
    sourceRef: "_MConverter.eu_Folien - Speicherverwaltung.md",
  },
  {
    id: "4-interne-fragmentierung-stelle",
    chapter: 4,
    chapterTitle: "Speicherverwaltung",
    mcqOptions: [
      { id: "4-intfrag-opt-1", text: "Interne Fragmentierung entsteht innerhalb fester Partitionen, wenn die Partition größer als der Bedarf des Prozesses ist", correct: true },
      { id: "4-intfrag-opt-2", text: "Sie tritt bei dynamischer Partitionierung auf, wenn viele kleine Lücken zwischen belegten Bereichen entstehen", correct: false },
      { id: "4-intfrag-opt-3", text: "Interne Fragmentierung entsteht nur auf HDD-Festplatten, nicht im Hauptspeicher", correct: false },
      { id: "4-intfrag-opt-4", text: "Sie wird durch Paging vollständig verhindert", correct: false },
    ],
    question: "An welcher Stelle findet interne Fragmentierung statt?",
    answer:
      "Interne Fragmentierung entsteht innerhalb einer festen Partition, die einem Prozess zugewiesen ist: ist die Partition größer als der Bedarf des Prozesses, bleibt der ungenutzte Speicherplatz innerhalb der Partition verloren, bis der Speicher neu verteilt wird. Sie tritt also bei der direkten Speicherverwaltung mit festen Partitionen auf.",
    sourceRef: "_MConverter.eu_Folien - Speicherverwaltung.md",
  },
  {
    id: "4-interne-fragmentierung-beheben",
    chapter: 4,
    chapterTitle: "Speicherverwaltung",
    question:
      "Mit welchem Verfahren lässt sich interne Fragmentierung theoretisch beheben?",
    answer:
      "Theoretisch lässt sich interne Fragmentierung durch eine dynamische Partitionierung beheben, die jedem Prozess einen exakt passenden Speicherbereich zuweist (variable Länge). Dadurch entsteht dann aber externe Fragmentierung, die wiederum durch Defragmentierung/Speicherkompaktierung behandelt werden muss.",
    sourceRef: "_MConverter.eu_Folien - Speicherverwaltung.md",
  },
  {
    id: "4-komponente-speichermedien-datenfluss",
    chapter: 4,
    chapterTitle: "Speicherverwaltung",
    question:
      "Welche Komponente verwaltet die Speichermedien und den Datenfluss in einem Rechnersystem?",
    answer:
      "Die Speicherverwaltung – als logischer und physischer Bestandteil des Prozessors – verwaltet die Speicherhierarchie, teilt Speicher zu und gibt ihn frei, verfolgt belegte Bereiche und steuert die Auslagerung auf Festplatte. Einschließlich der Memory Management Unit (MMU) wandelt sie logische in physische Adressen um.",
    sourceRef: "_MConverter.eu_Folien - Speicherverwaltung.md",
  },
  {
    id: "4-anforderungen-speichersystem",
    chapter: 4,
    chapterTitle: "Speicherverwaltung",
    question: "Welche Anforderungen werden an ein Speichersystem gestellt?",
    answer:
      "Speichermedien müssen u. a. ausreichend große Kapazität, kurze Zugriffszeiten und hohe Datenraten bieten; je kürzer die Zugriffszeit, desto teurer und kleiner der Speicher. An das Speichersystem werden zudem Sicherheit/Verfügbarkeit der Daten, Skalierbarkeit sowie die Eignung zur dauerhaften oder flüchtigen Speicherung gefordert (Hauptspeicher flüchtig, Langzeitspeicher nicht flüchtig).",
    sourceRef: "_MConverter.eu_Folien - Speicherverwaltung.md",
  },
  {
    id: "4-working-set-verhindern",
    chapter: 4,
    chapterTitle: "Speicherverwaltung",
    question:
      "Was wird mit der Working-Set-Methode versucht zu verhindern?",
    answer:
      "Die Working-Set-Methode verknüpft Paging mit der Struktur des Programms: Das Programm wird in Phasen zerlegt und aus allen für eine Phase benötigten Seitenrahmen ein Working-Set gebildet. Durch vollständiges Laden des Working-Sets vor Phasenbeginn werden Seitenfehler während der Ausführung dieser Phase vermieden.",
    sourceRef: "_MConverter.eu_Folien - Speicherverwaltung.md",
  },
  {
    id: "4-ohne-l3-cache",
    chapter: 4,
    chapterTitle: "Speicherverwaltung",
    question: "Welche Systeme verfügen nicht über L3-Cache?",
    answer:
      "Typischerweise verfügen einfache oder ältere Systeme mit nur einstufigem Cache (oder nur L1/L2-Cache) sowie bestimmte Embedded- und Micro-Controller-Systeme nicht über einen L3-Cache, da der L3-Cache zur gemeinsamen Cache-Ebene mehrerer Prozessorkerne gehört und nur bei entsprechend höher entwickelten Mehrkernprozessoren vorgesehen ist.",
    sourceRef: "_MConverter.eu_Folien - Speicherverwaltung.md",
    confidence: "low",
  },
  {
    id: "4-mmu-logisch-physisch",
    chapter: 4,
    chapterTitle: "Speicherverwaltung",
    question:
      "Welche Komponente übersetzt logische in physische Speicheradressen?",
    answer:
      "Die Memory Management Unit (MMU) wandelt logische Adressen, wie Prozesse sie verwenden, in die physischen Adressen des Hauptspeichers um. Bei absoluter Adressierung sind logische und physische Adresse identisch; bei dynamischer Adressierung zur Laufzeit wird die MMU zwingend benötigt.",
    sourceRef: "_MConverter.eu_Folien - Speicherverwaltung.md",
  },
  {
    id: "4-mmu-nicht-prozessebene",
    chapter: 4,
    chapterTitle: "Speicherverwaltung",
    question:
      "Warum passiert die Übersetzung logisch→physisch nicht auf Programm/Prozessebene?",
    answer:
      "Weil Prozesse in eigenen logischen Adressräumen arbeiten und einander nicht kennen dürfen, kann das einzelne Programm die physische Lage nicht selbst kennen oder steuern. Die Übersetzung muss daher zentral, hardwaregestützt und geschützt durch die MMU erfolgen, damit die Speicherverwaltung Isolation, Schutz und das Mapping mehrerer Prozesse auf denselben Hauptspeicher gewährleisten kann.",
    sourceRef: "_MConverter.eu_Folien - Speicherverwaltung.md",
  },

  // ───────────────────── Kapitel 5 – Datensicherung ─────────────────────────
  {
    id: "5-raid0-nicht-echt",
    chapter: 5,
    chapterTitle: "Datensicherung",
    mcqOptions: [
      { id: "5-raid0-opt-1", text: "RAID 0 bietet keine Redundanz; es verteilt Daten nur zur Steigerung der Transferrate – fällt eine Platte aus, sind alle Daten verloren", correct: true },
      { id: "5-raid0-opt-2", text: "RAID 0 speichert alle Daten doppelt, sodass eine defekte Platte kein Problem darstellt", correct: false },
      { id: "5-raid0-opt-3", text: "RAID 0 ist kein echtes RAID, weil es mindestens 5 Festplatten benötigt", correct: false },
      { id: "5-raid0-opt-4", text: "RAID 0 verwendet Paritätsinformationen, um Daten beim Ausfall einer Platte wiederherzustellen", correct: false },
    ],
    question: "Warum ist RAID 0 kein „richtiges“ RAID-System?",
    answer:
      "RAID 0 bietet keine Redundanz: Die Festplatten werden in zusammenhängende Blöcke gleicher Größe aufgeteilt, und Daten werden verteilt – Ziel ist ausschließlich die Steigerung der Datentransferrate durch parallele Zugriffe. Da kein „R“ (Redundant) vorliegt, fallen bei Ausfall einer Platte alle Daten aus und können nicht rekonstruiert werden; es eignet sich also nur, wenn Datensicherheit unwichtig ist oder eine zusätzliche Sicherung existiert.",
    sourceRef: "_MConverter.eu_Folien - Kapitel 4 - Datensicherung.md",
  },
  {
    id: "5-deduplizierung",
    chapter: 5,
    chapterTitle: "Datensicherung",
    question: "Was wird mit dem Prinzip der Deduplizierung erreicht?",
    answer:
      "Deduplizierung erhöht die Speichereffizienz einer Sicherung, indem Redundanzen innerhalb eines Backups entfernt werden: Auf Blockebene werden identische Daten erkannt und durch einen Pointer auf die erste Instanz ersetzt. Anwendungsfälle sind Datensicherung und Datentransfer, z. B. Deduplikation identischer E-Mail-Anhänge.",
    sourceRef: "_MConverter.eu_Folien - Kapitel 4 - Datensicherung.md",
  },
  {
    id: "5-persoenliche-dateien-systemabbild",
    chapter: 5,
    chapterTitle: "Datensicherung",
    question:
      "Warum ist es ratsam, persönliche/wichtige Dateien unabhängig von einem Systemabbild zu sichern?",
    answer:
      "Ein Systemabbild enthält den gesamten Inhalt eines oder mehrerer Laufwerke und folgt dem „Alles-oder-Nichts“-Prinzip: Es kann nur vollständig zurückgesichert werden, einzelne Dateien lassen sich daraus nicht auswählen. Wer persönliche Dateien zusätzlich separat sichert, vermeidet im Ernstfall eine komplette Wiederherstellung des gesamten Systems und kann gezielt einzelne Dateien zurückholen.",
    sourceRef: "_MConverter.eu_Folien - Kapitel 4 - Datensicherung.md",
  },
  {
    id: "5-file-vs-block-level",
    chapter: 5,
    chapterTitle: "Datensicherung",
    mcqOptions: [
      { id: "5-file-opt-1", text: "File-Level-Backup sichert vollständige Dateien; Block-Level sichert nur geänderte Datenblöcke einer Datei", correct: true },
      { id: "5-file-opt-2", text: "Block-Level-Backup ist langsamer als File-Level-Backup, weil es ganze Dateien kopiert", correct: false },
      { id: "5-file-opt-3", text: "File-Level und Block-Level sind identische Verfahren mit unterschiedlichen Namen", correct: false },
      { id: "5-file-opt-4", text: "Block-Level erlaubt die Wiederherstellung einzelner Dateien einfacher als File-Level", correct: false },
    ],
    question:
      "Was unterscheidet File-Level-Backup und Block-Level-Backup?",
    answer:
      "File-Level-Backup sichert vollständige Dateien auf einem Datenträger; es bewegt große Datenmengen (langsam), erlaubt aber direkten Zugriff und einfache Wiederherstellung einzelner Dateien. Block-Level-Backup sichert nur geänderte Datenblöcke einer Datei; es ist schneller und verbraucht weniger Speicherplatz, aber die Wiederherstellung einzelner Dateien ist aufwendiger, da Blöcke erst zusammengesetzt werden müssen.",
    sourceRef: "_MConverter.eu_Folien - Kapitel 4 - Datensicherung.md",
  },
  {
    id: "5-wiederherstellungspunkt",
    chapter: 5,
    chapterTitle: "Datensicherung",
    question: "Was wird bei einem Wiederherstellungspunkt gesichert?",
    answer:
      "Ein Wiederherstellungspunkt ist eine Schattenkopie, die System- und Konfigurationsdateien des Betriebssystems betrifft; persönliche Daten werden nicht gesichert. Er wird sinnvollerweise manuell vor Softwareinstallationen oder Systemanpassungen angelegt, und Windows legt automatisch solche Punkte etwa vor Updates oder Treiberinstallationen an.",
    sourceRef: "_MConverter.eu_Folien - Kapitel 4 - Datensicherung.md",
  },
  {
    id: "5-systempruefpunkt",
    chapter: 5,
    chapterTitle: "Datensicherung",
    question: "Was ist ein Systemprüfpunkt?",
    answer:
      "Ein Systemprüfpunkt ist ein automatisch durch das Betriebssystem angelegter Wiederherstellungspunkt, etwa bevor Windows Updates oder bestimmte Treiber installiert. Er sichert System- und Konfigurationsdaten als Schattenkopie und ermöglicht das Zurücksetzen des Systems auf diesen Zustand.",
    sourceRef: "_MConverter.eu_Folien - Kapitel 4 - Datensicherung.md",
  },
  {
    id: "5-systempruefpunkt-nicht-gesichert",
    chapter: 5,
    chapterTitle: "Datensicherung",
    question:
      "Welche Informationen werden bei einem Systemprüfpunkt nicht gesichert?",
    answer:
      "Bei einem (System-)Wiederherstellungspunkt bzw. Systemprüfpunkt werden System- und Konfigurationsdateien des Betriebssystems als Schattenkopie gesichert, persönliche Daten jedoch ausdrücklich nicht. Diese müssen unabhängig davon separat gesichert werden.",
    sourceRef: "_MConverter.eu_Folien - Kapitel 4 - Datensicherung.md",
  },

  // ───────────── Kapitel 6 – Sicherheit in Betriebssystemen ─────────────────
  {
    id: "6-drei-malware-arten",
    chapter: 6,
    chapterTitle: "Sicherheit in Betriebssystemen",
    mcqOptions: [
      { id: "6-drei-malware-opt-1", text: "Virus", correct: true },
      { id: "6-drei-malware-opt-2", text: "Wurm", correct: true },
      { id: "6-drei-malware-opt-3", text: "Trojaner", correct: true },
      { id: "6-drei-malware-opt-4", text: "Firewall", correct: false },
      { id: "6-drei-malware-opt-5", text: "Compiler", correct: false },
      { id: "6-drei-malware-opt-6", text: "Antivirenprogramm", correct: false },
    ],
    question: "Nennen Sie drei Arten von Malware!",
    answer:
      "Drei Arten von Malware (Schadsoftware) sind: Viren (sich an Programmcode anhängende, sich replizierende Programme), Würmer (sich aktiv über Netzwerkverbindungen verbreitende Programme ohne Wirtdatei) und Trojaner (Software, die den eigentlichen schädlichen Inhalt verschleiert und im Hintergrund Schadsoftware ausführt). Weitere Beispiele sind Ransomware, Adware/Spyware.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 6 gesamt.md",
  },
  {
    id: "6-wuermer-verbreitung",
    chapter: 6,
    chapterTitle: "Sicherheit in Betriebssystemen",
    mcqOptions: [
      { id: "6-wurm-opt-1", text: "Würmer verbreiten sich aktiv über Netzwerkverbindungen (Kopieren/Ausführen) und benötigen keine Wirtdateien", correct: true },
      { id: "6-wurm-opt-2", text: "Ein Wurm muss sich wie ein Virus an eine ausführbare Datei anhängen, um sich zu verbreiten", correct: false },
      { id: "6-wurm-opt-3", text: "Würmer verbreiten sich ausschließlich über USB-Sticks und Wechselmedien", correct: false },
      { id: "6-wurm-opt-4", text: "Würmer sind eine veraltete Bezeichnung für moderne Viren", correct: false },
    ],
    question: "Wie verbreiten sich Computerwürmer?",
    answer:
      "Würmer verbreiten sich aktiv über Netzwerkverbindungen (Kopieren und Ausführen), nutzen Hilfsprogramme wie E-Mail-Programme mit, benötigen keine Wirtdateien (im Gegensatz zu Viren) und können sich auch über Wechselmedien ausbreiten. Sie nutzen Sicherheitslücken auf Zielsystemen aus und existieren als aktives schadhaftes Programm auf dem Zielsystem.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 6 gesamt.md",
  },
  {
    id: "6-virus-phasen",
    chapter: 6,
    chapterTitle: "Sicherheit in Betriebssystemen",
    mcqOptions: [
      { id: "6-virus-opt-1", text: "Infektion (Anhängen an Wirtprogramm und Ausführen)", correct: true },
      { id: "6-virus-opt-2", text: "Replikation (Virusreproduktion durch infizierte Programme)", correct: true },
      { id: "6-virus-opt-3", text: "Schadensphase (zeit- oder eventgesteuerter Auslöser)", correct: true },
      { id: "6-virus-opt-4", text: "Defragmentierung (Bereinigung der infizierten Dateien)", correct: false },
      { id: "6-virus-opt-5", text: "Authentifizierung (Erzwingen einer Benutzeranmeldung)", correct: false },
    ],
    question: "Welche Phasen durchläuft ein Virus?",
    answer:
      "Ein Virus wird an Programmcode angehängt und bei Ausführung aktiv. Es durchläuft: Infektion (Anhängen an ein Wirtprogramm und Ausführen des infizierten Programms), Replikation (Virusreproduktion durch infizierte Programme) und Schadensphase (Auslöser zeitgesteuert oder eventgesteuert; Schaden betrifft Software und indirekt Hardware).",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 6 gesamt.md",
  },
  {
    id: "6-digitale-signatur",
    chapter: 6,
    chapterTitle: "Sicherheit in Betriebssystemen",
    question:
      "Erläutern Sie das Prinzip einer digitalen Signatur für eine Software!",
    answer:
      "Eine digitale Signatur verwendet eine Prüfsumme (MD5, SHA256) der Programmdateien plus ein Public-Key-Kryptosystem: Nur der Inhaber des privaten Schlüssels kann die Signatur erstellen, jeder kann sie mit dem öffentlichen Schlüssel auf Authentizität prüfen. Vor dem Programmstart wird die Signatur geprüft; bei fehlerhafter Signatur wird der Start verhindert (SecureBoot/TPM).",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 6 gesamt.md",
  },
  {
    id: "6-schadsoftware-zwecke",
    chapter: 6,
    chapterTitle: "Sicherheit in Betriebssystemen",
    question:
      "Nach welchen Zwecken lässt sich Schadsoftware unterscheiden?",
    answer:
      "Schadsoftware lässt sich nach ihrem Zweck unterscheiden, z. B. Daten ausspionieren (Spyware, Datenerfassung), Identitäten stehlen bzw. Zugänge erlangen (Phishing, Trojaner), Geld erpressen (Ransomware verschlüsselt/sperrt Daten gegen „Lösegeld“), Ressourcen verbrauchen (für Botnets/DDoS) sowie Werbung einblenden oder Systeme überwachen (Adware).",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 6 gesamt.md",
  },
  {
    id: "6-phishing-ziele",
    chapter: 6,
    chapterTitle: "Sicherheit in Betriebssystemen",
    mcqOptions: [
      { id: "6-phish-opt-1", text: "Persönliche Daten und Login-Informationen – oft der erste Schritt zur Übernahme einer fremden Identität", correct: true },
      { id: "6-phish-opt-2", text: "Die Festplattengröße und Prozessortaktung des Opfers auszulesen", correct: false },
      { id: "6-phish-opt-3", text: "Malware direkt auf dem Zielsystem zu installieren, ohne vorher Daten zu sammeln", correct: false },
      { id: "6-phish-opt-4", text: "Netzwerkverbindungen zu verschlüsseln, um sie gegen Abhören zu schützen", correct: false },
    ],
    question: "Worauf zielen Phishing-Angriffe ab?",
    answer:
      "Phishing (von „Angeln“) ahmt vertrauenswürdige Internetseiten/Oberflächen nach und zielt auf persönliche Daten und Login-Informationen. Es ist oft der erste Schritt bei Cyberkriminalität zur Übernahme einer fremden Identität; die Idee ist so alt wie die Telefonie.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 6 gesamt.md",
  },
  {
    id: "6-firewall-regelwerk",
    chapter: 6,
    chapterTitle: "Sicherheit in Betriebssystemen",
    question: "Was stellt das Regelwerk in einer Firewall dar?",
    answer:
      "Das Regelwerk ist die technische Umsetzung der Sicherheitspolitik und enthält alle Informationen, die notwendig sind, um über ein Protokollelement zu entscheiden: Nutzer, Authentifizierungsverfahren, Verbindungen, erlaubte/verbotene Protokolle und Dienste. Im Entscheidungsmodul werden die Analyseergebnisse mit dem Regelwerk verglichen und ankommende Pakete werden passieren gelassen oder abgelehnt.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 6 gesamt.md",
  },
  {
    id: "6-firewall-bastion",
    chapter: 6,
    chapterTitle: "Sicherheit in Betriebssystemen",
    question: "Wo ist die Bastion einer Firewall zu finden?",
    answer:
      "Die Bastion ist das IT-System mit dem Application-Gateway, meist realisiert als „Dual-Homed Gateway“ mit zwei Netzwerkanschlüssen. Sie logisch und physisch entkoppelt die Netzwerke und bildet den einzigen Zugang vom unsicheren in das sichere Netz; sie ist der wertvollste Bestandteil des IT-Systems und muss besonders geschützt werden.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 6 gesamt.md",
  },
  {
    id: "6-proxy-aufgabe",
    chapter: 6,
    chapterTitle: "Sicherheit in Betriebssystemen",
    question: "Was ist die Aufgabe eines Proxys?",
    answer:
      "Ein Proxy („Stellvertreter“) nimmt Pakete an unterschiedlichen Ports an der Netzzugangsschicht an und erlaubt bestimmte Dienste bzw. leitet entsprechende Pakete vom unsicheren ins sichere Netz weiter. Aus Sicht des Anwenders kommuniziert er direkt mit dem Zielsystem; für jeden Dienst/jedes Protokoll wird ein eigener Proxy benötigt. Er bietet weitere Sicherheitsdienste, intensive Analyse und Protokollierung.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 6 gesamt.md",
  },
  {
    id: "6-packet-filter",
    chapter: 6,
    chapterTitle: "Sicherheit in Betriebssystemen",
    question: "Erläutern Sie die Arbeitsweise eines Packet-Filters!",
    answer:
      "Ein Packet-Filter verhält sich wie eine Netzwerk-Bridge: Empfangene Pakete werden aufgenommen und auf mehreren Ebenen analysiert (Netzzugangsschicht: Quell-/Zieladresse, Protokolltyp; Netzwerkebene: Optionsfelder, Flags, Unterbindung von Fragmentierung; Transportebene: Portnummern, TCP-Verbindungsrichtung). Die Prüfinformationen werden dem Regelwerk entnommen und mit den Analyseergebnissen verglichen; bei Regelverstoß wird das Ereignis als sicherheitsrelevant protokolliert und gemeldet. Er ist transparent und leistungsfähig.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 6 gesamt.md",
  },
  {
    id: "6-firewall-regeln-offenlegen",
    chapter: 6,
    chapterTitle: "Sicherheit in Betriebssystemen",
    question:
      "Warum ist es sicherheitskritisch, Firewall-Regeln offen zu legen?",
    answer:
      "Das Regelwerk ist die technische Umsetzung der Sicherheitspolitik und enthält alle wichtigen Informationen (Nutzer, Verbindungen, erlaubte/verbotene Dienste). Wer diese Regeln (z. B. zulässige Ports, Protokolle, Struktur) kennt, kennt die Angriffsfläche und kann gezielt Lücken oder zugelassene Verbindungen ausnutzen. Hohe Komplexität verleitet zudem zu Oberflächlichkeit, widersprüchliche oder sich aufhebende Regeln verletzen die Widerspruchsfreiheit.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 6 gesamt.md",
  },
  {
    id: "6-firewall-designkonzept",
    chapter: 6,
    chapterTitle: "Sicherheit in Betriebssystemen",
    question: "Nennen und erläutern Sie ein Designkonzept einer Firewall!",
    answer:
      "Beispiel Application-Gateway (Proxy-Gateway): Es logisch und physisch entkoppelt die Netzwerke, realisiert meist als Dual-Homed Gateway; für jeden erlaubten Dienst existiert ein eigener Proxy, ohne Proxy keine Übertragung. Vorteile: sicheres Design durch kleine überschaubare Module, alle Pakete müssen über den Proxy, Entkopplung der Dienste, Verbergen der internen Struktur (NAT). Nachteile: geringe Flexibilität (neuer Dienst = neuer Proxy), höherer Aufwand bei verschlüsselter Kommunikation.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 6 gesamt.md",
  },
  {
    id: "6-transparente-firewall",
    chapter: 6,
    chapterTitle: "Sicherheit in Betriebssystemen",
    mcqOptions: [
      { id: "6-transp-opt-1", text: "Transparent bedeutet, die Firewall ist für Nutzer und Netzwerkteilnehmer unsichtbar und benötigt keine aktive Einwirkung", correct: true },
      { id: "6-transp-opt-2", text: "Transparent bedeutet, die Firewall-Regeln sind für alle Netzwerkteilnehmer einsehbar", correct: false },
      { id: "6-transp-opt-3", text: "Transparent heißt, dass die Firewall ausschließlich aus Glasfaserkomponenten besteht", correct: false },
      { id: "6-transp-opt-4", text: "Eine transparente Firewall filtert ausschließlich auf der Anwendungsebene", correct: false },
    ],
    question:
      "Was bedeutet „transparente Arbeitsweise“ im Bezug auf eine Firewall?",
    answer:
      "„Transparent“ heißt, die Firewall ist für Nutzer und Netzwerkteilnehmer unsichtbar und benötigt keine aktive Einwirkung durch den Anwender. Packet-Filter z. B. werden transparent in die Netzwerkverbindung eingebunden, koppeln die Netzwerke logisch und wirken für Anwender und IT-Systeme, als wären sie nicht vorhanden.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 6 gesamt.md",
  },
  {
    id: "6-safety-vs-security",
    chapter: 6,
    chapterTitle: "Sicherheit in Betriebssystemen",
    mcqOptions: [
      { id: "6-safety-opt-1", text: "Security schützt vor unautorisiertem Eindringen; Safety meint Betriebssicherheit (fehlerfreies Verhalten gemäß Spezifikation)", correct: true },
      { id: "6-safety-opt-2", text: "Safety und Security sind synonyme Begriffe für den Schutz vor Malware", correct: false },
      { id: "6-safety-opt-3", text: "Safety ist der Schutz vor Viren, Security der Schutz vor Trojanern", correct: false },
      { id: "6-safety-opt-4", text: "Security bedeutet Betriebssicherheit, Safety ist Angriffsabwehr", correct: false },
    ],
    question:
      "Welche Unterscheidung können Sie zwischen Safety und Security treffen?",
    answer:
      "Security (Sicherheit im Sinne von Sicherheit gegen Manipulation von außen) richtet sich gegen unautorisiertes Eindringen, z. B. durch Zwei-Faktor-Authentifizierung. Safety (Betriebssicherheit) meint, dass sich das System entsprechend der Spezifikation fehlerfrei verhält, ohne externe Akteure oder Manipulation – es geht also um Ausfallsicherheit/Verlässlichkeit, nicht um Angriffsabwehr.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 6 gesamt.md",
  },
  {
    id: "6-verdeckte-kanaele",
    chapter: 6,
    chapterTitle: "Sicherheit in Betriebssystemen",
    question:
      "Welche Kanäle lassen sich zur verdeckten Kommunikation nutzen?",
    answer:
      "Verdeckte (parasitäre) Kanäle nutzen die Bandbreite legitimer Kommunikationskanäle, um Informationen zu übermitteln. Beispiele sind Steganographie (Einbringen von Text in Bild- oder Audiodaten, etwa in RGB-Bits) sowie Dateioperationen nach einem bestimmten Muster zur Übermittlung binärer Informationen. Die Verwendung mehrerer Kanäle ist möglich.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 6 gesamt.md",
  },
  {
    id: "6-verdeckte-komm-schwer",
    chapter: 6,
    chapterTitle: "Sicherheit in Betriebssystemen",
    question: "Warum ist verdeckte Kommunikation so schwer aufzudecken?",
    answer:
      "Weil parasitäre Kanäle die Bandbreite legitimer, erlaubter Kommunikation nutzen und in diese eingebettet sind, lassen sie sich praktisch nicht ausschließen oder verhindern. Das Verhalten (z. B. Dateioperationen nach Muster) ist nur mit großem Aufwand erkennbar, da das Trägermedium normaler Verkehr ist und erst durch Schwellenwerte/Audit-Protokolle auffällige Muster erkannt werden müssen.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 6 gesamt.md",
  },
  {
    id: "6-bell-lapadula-prinzip",
    chapter: 6,
    chapterTitle: "Sicherheit in Betriebssystemen",
    mcqOptions: [
      { id: "6-blp-opt-1", text: "Das BLP-Modell sichert Vertraulichkeit durch Sicherheitsstufen für Dokumente und Benutzer (No Read Up, No Write Down)", correct: true },
      { id: "6-blp-opt-2", text: "Das Bell-Lapadula-Modell dient ausschließlich dem Schutz vor Malware in Betriebssystemen", correct: false },
      { id: "6-blp-opt-3", text: "BLP regelt den Zugriff auf CPU-Ressourcen zwischen Prozessen", correct: false },
      { id: "6-blp-opt-4", text: "Das Modell ist ein Firewall-Designkonzept für die Netzwerkschicht", correct: false },
    ],
    question: "Nach welchem Prinzip arbeitet das Bell-Lapadula-Modell?",
    answer:
      "Das Bell-Lapadula-Modell (BLP) sichert die Vertraulichkeit: Es vergibt Sicherheitsstufen für Dokumente/Programme (nicht klassifiziert, vertraulich, geheim, streng geheim etc.) und entsprechende Stufen für Benutzer; der Ersteller setzt die Stufe. Der Informationsfluss wird so geregelt, dass kein unerlaubter Zugriff stattfindet („No Read Up, No Write Down“). Das BS muss die Stufe mit dem Benutzer verbinden und an Kinderprozesse weitergeben – mit viel Verwaltungsaufwand.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 6 gesamt.md",
  },
  {
    id: "6-authentifizierung-fragen",
    chapter: 6,
    chapterTitle: "Sicherheit in Betriebssystemen",
    question:
      "Welche Fragen können bei einer Authentifizierung gestellt werden?",
    answer:
      "Authentifizierung weist eine Identität nach. Die drei klassischen Kategorien von Authentifizierungsfaktoren („Fragen“) sind: etwas, das man weiß (Passwörter/PINs), etwas, das man hat (Token, Smartcard, Sicherheitsschlüssel) und etwas, das man ist (biometrische Merkmale wie Fingerabdruck). Häufig kombiniert in der Zwei-Faktor-Authentifizierung.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 6 gesamt.md",
    confidence: "low",
  },
  {
    id: "6-drei-sicherheitspolitiken",
    chapter: 6,
    chapterTitle: "Sicherheit in Betriebssystemen",
    question:
      "Erläutern Sie das Prinzip der drei Ihnen bekannten Sicherheitspolitiken und nennen Sie je einen Vor- und Nachteil!",
    answer:
      "(1) Konfiguriertes Kommunikationsmodell: aktive Auseinandersetzung mit den Netzwerkteilnehmern, Unterscheidung in erlaubte/unerlaubte, Status durch die Sicherheitspolitik festgelegt – +hohe Kontrolle; −/hoher Konfigurations- und Pflegeaufwand. (2) Allgemeines (restriktives) Modell: nur erlaubte Teilnehmer/Protokolle sind zugelassen – +sehr sicher; −/unflexibel, Dienste werden blockiert. (3) Permissive (offene) Variante: alles erlaubt außer explizit Verbotenem – +einfach nutzbar; −/geringer Schutz, neue Angriffswege unbekannt.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 6 gesamt.md",
    confidence: "low",
  },
  {
    id: "6-vier-firewall-aufgaben",
    chapter: 6,
    chapterTitle: "Sicherheit in Betriebssystemen",
    mcqOptions: [
      { id: "6-vier-firewall-opt-1", text: "Unsicheres vom geschützten Netz trennen", correct: true },
      { id: "6-vier-firewall-opt-2", text: "Zulässige Protokolle/Daten prüfen", correct: true },
      { id: "6-vier-firewall-opt-3", text: "Dienste entkoppeln und Netzstruktur verbergen", correct: true },
      { id: "6-vier-firewall-opt-4", text: "Sicherheitsereignisse protokollieren", correct: true },
      { id: "6-vier-firewall-opt-5", text: "E-Mails verschlüsseln", correct: false },
      { id: "6-vier-firewall-opt-6", text: "Festplatten spiegeln (RAID 1)", correct: false },
    ],
    question: "Nennen Sie vier Aufgaben einer Firewall!",
    answer:
      "Vier Aufgaben einer Firewall sind: (1) Trennung des unsicheren vom zu schützenden Netz und Realisierung eines gesicherten Übergangs; (2) Prüfung, welche IT-Systeme/Nutzer/Daten/Protokolle über die Firewall kommunizieren dürfen (Netz-/Nutzer-/Datenebene); (3) Entkopplung von Diensten zur Vermeidung von Angriffen durch Implementierungsfehler (z. B. via VPN) und Verbergen der Netzstruktur; (4) Protokollierung sicherheitsrelevanter Ereignisse und Weiterleitung/Alarmierung an Sicherheitsmanagement und Anwender.",
    sourceRef: "_MConverter.eu_Betriebssysteme_Kapitel 6 gesamt.md",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // RECHNERNETZE – DB-markierte Prüfungsfragen
  // Modellantworten autorenfundierte Schätzungen aus Tanenbaum (5. Aufl.)
  // und den RNG-Vorlesungsfolien, markiert confidence:"low" zur Nachprüfung.
  // Kapitel 1 = Netzstruktur/Übersicht, 2 = Referenzmodelle (OSI/TCP-IP),
  // 3 = Bitübertragung/Anschlussnetze, 4 = Sicherungsschicht/MAC,
  // 5 = Vermittlungsschicht/IP.
  // ═══════════════════════════════════════════════════════════════════════

  // ───────────────── Kapitel RN 1 – Netzstruktur & Übersicht ─────────────

  {
    id: "rn1-itu-aufgaben",
    courseId: "rechnernetze",
    chapter: 1,
    chapterTitle: "Netzstruktur & Übersicht",
    confidence: "low",
    mcqOptions: [
      { id: "rn1-itu-opt-a", text: "Die ITU-T gibt technische Empfehlungen für Telefon-, Telegraphen- und Datenkommunikationsschnittstellen.", correct: true },
      { id: "rn1-itu-opt-b", text: "Die ITU ist eine Agentur der Vereinten Nationen, die internationale Telekommunikationsstandards entwickelt und die Nutzung von Funkfrequenzen weltweit koordiniert.", correct: true },
      { id: "rn1-itu-opt-c", text: "Der ITU-Entwicklungssektor (ITU-D) fördert IKT, um die digitale Kluft zwischen Ländern zu verringern.", correct: true },
      { id: "rn1-itu-opt-d", text: "Die ITU ist eine rein politische Organisation ohne Einfluss auf die Standardisierung von Telekommunikationssystemen.", correct: false },
      { id: "rn1-itu-opt-e", text: "Die ITU koordiniert ausschließlich die Entwicklung von Internetstandards und hat keinen Einfluss auf traditionelle Telekommunikation wie Telefon oder Telegrafie.", correct: false },
    ],
    question: "Welche Aussagen zu Aufgaben und Funktionen der ITU sind korrekt?",
    answer:
      "Die ITU (International Telecommunication Union) ist eine UN-Sonderorganisation. Ihr Sektor ITU-T erarbeitet Empfehlungen („Recommendations“) für Telefon-, Telegraphen- und Datenkommunikationsschnittstellen; ITU-R koordiniert die weltweite Nutzung der Funkfrequenzen; ITU-D fördert den Einsatz von IKT zur Verringerung der digitalen Kluft. Sie ist also weder rein politisch noch auf Internetstandards beschränkt.",
    sourceRef: "computer-networks-tanenbaum-5th-edition.md",
  },
  {
    id: "rn1-netzneutralitaet",
    courseId: "rechnernetze",
    chapter: 1,
    chapterTitle: "Netzstruktur & Übersicht",
    confidence: "low",
    mcqOptions: [
      { id: "rn1-nn-opt-a", text: "ISPs müssen den gesamten Datenverkehr ohne Priorisierung oder Blockierung weiterleiten, unabhängig vom Anbieter.", correct: true },
      { id: "rn1-nn-opt-b", text: "ISPs dürfen beliebige Dienste bevorzugen oder blockieren, solange sie dies transparent machen.", correct: false },
      { id: "rn1-nn-opt-c", text: "ISPs sind verpflichtet, bestimmte Dienste wie VoIP und Video-Streaming zu blockieren, wenn diese mit ihren eigenen Angeboten konkurrieren.", correct: false },
      { id: "rn1-nn-opt-d", text: "ISPs dürfen den Datenverkehr beliebig priorisieren, solange sie eine angemessene Netzwerkmanagementpraxis anwenden.", correct: false },
    ],
    question: "Welche Aussage beschreibt am besten das Prinzip der Netzneutralität?",
    answer:
      "Netzneutralität bedeutet, dass ISPs den gesamten Datenverkehr gleichbehandeln müssen – ohne Bevorzugung, Benachteiligung, Priorisierung oder Blockierung einzelner Dienste oder Anbieter.",
    sourceRef: "computer-networks-tanenbaum-5th-edition.md",
  },
  {
    id: "rn1-transitnetz-trends",
    courseId: "rechnernetze",
    chapter: 1,
    chapterTitle: "Netzstruktur & Übersicht",
    confidence: "low",
    mcqOptions: [
      { id: "rn1-transit-opt-a", text: "Konsolidierung von Inhalten bei einer Handvoll großer Inhaltsanbieter.", correct: true },
      { id: "rn1-transit-opt-b", text: "Ausweitung des Footprints von ISP-Netzen mit individuellem Zugang.", correct: true },
      { id: "rn1-transit-opt-c", text: "Direkte Verbindungen zwischen großen ISPs und großen Inhaltsanbietern.", correct: true },
      { id: "rn1-transit-opt-d", text: "Erhöhung der Gebühren für Transitnetze.", correct: false },
    ],
    question: "Welche Trends haben die Entwicklung von Transitnetzen und ISPs beeinflusst?",
    answer:
      "Treibende Trends sind die Konsolidierung von Inhalten bei wenigen großen Anbietern, die Ausweitung von ISP-Netzen mit individuellem Zugang sowie direkte Verbindungen (Peering/Private Interconnects) zwischen großen ISPs und großen Inhaltsanbietern. Eine Erhöhung der Transitgebühren gehört nicht zu diesen Trends.",
    sourceRef: "computer-networks-tanenbaum-5th-edition.md",
  },
  {
    id: "rn1-datenuebertragung-internet",
    courseId: "rechnernetze",
    chapter: 1,
    chapterTitle: "Netzstruktur & Übersicht",
    confidence: "low",
    mcqOptions: [
      { id: "rn1-ueb-opt-a", text: "Ihr ISP hostet in der Regel die Inhalte der Websites, die Sie besuchen.", correct: false },
      { id: "rn1-ueb-opt-b", text: "Inhalte müssen im Internet vom Rechenzentrum über das Zugangsnetz Ihr Gerät erreichen.", correct: true },
      { id: "rn1-ueb-opt-c", text: "Transitnetzwerke berechnen normalerweise Gebühren für die Datenübertragung an beide Parteien.", correct: false },
      { id: "rn1-ueb-opt-d", text: "Die Daten reisen über viele unabhängig betriebene Netzwerke.", correct: true },
    ],
    question: "Welche Aussagen zur Datenübertragung im Internet sind korrekt?",
    answer:
      "Inhalte liegen typischerweise in Rechenzentren und müssen über das Zugangsnetz zum Endgerät gelangen. Auf dem Weg durchlaufen die Daten viele unabhängig betriebene Netze (Access-, Transit- und Backbone-Netze). Der eigene ISP hostet die Inhalte in der Regel nicht, und Transitgebühren fallen üblicherweise nicht bei beiden Parteien gleichzeitig an.",
    sourceRef: "computer-networks-tanenbaum-5th-edition.md",
  },
  {
    id: "rn1-cdn-eigenschaften",
    courseId: "rechnernetze",
    chapter: 1,
    chapterTitle: "Netzstruktur & Übersicht",
    confidence: "low",
    mcqOptions: [
      { id: "rn1-cdn-opt-a", text: "Sie replizieren Inhalte an vielen Standorten, um die Bereitstellung zu optimieren.", correct: true },
      { id: "rn1-cdn-opt-b", text: "CDNs sind geografisch verteilte Ansammlungen von Servern.", correct: true },
      { id: "rn1-cdn-opt-c", text: "CDNs werden ausschließlich von großen Unternehmen wie Google und Netflix betrieben.", correct: false },
      { id: "rn1-cdn-opt-d", text: "CDNs berücksichtigen bei der Auswahl der Replik auch die Last auf den Servern und die Netzwerklast.", correct: true },
    ],
    question: "Welche Aussagen über CDNs (Content Delivery Networks) sind korrekt?",
    answer:
      "CDNs sind geografisch verteilte Server-Cluster, die Inhalte an vielen Standorten replizieren und bei der Replikauswahl Netzwerk- und Serverlast berücksichtigen, um die Auslieferung zu optimieren. Sie werden nicht ausschließlich von Google/Netflix betrieben, sondern auch von spezialisierten Anbietern (z. B. Akamai, Cloudflare).",
    sourceRef: "computer-networks-tanenbaum-5th-edition.md",
  },
  {
    id: "rn1-metcalfe-law",
    courseId: "rechnernetze",
    chapter: 1,
    chapterTitle: "Netzstruktur & Übersicht",
    confidence: "low",
    mcqOptions: [
      { id: "rn1-met-opt-a", text: "Der Wert eines Netzwerks ist konstant.", correct: false },
      { id: "rn1-met-opt-b", text: "Der Wert eines Netzwerks nimmt mit der Anzahl der Benutzer ab.", correct: false },
      { id: "rn1-met-opt-c", text: "Der Wert eines Netzwerks wächst proportional zur Anzahl der Benutzer.", correct: false },
      { id: "rn1-met-opt-d", text: "Der Wert eines Netzwerks ist proportional zum Quadrat der Anzahl der Benutzer.", correct: true },
    ],
    question: "Was beschreibt Metcalfe's Law?",
    answer:
      "Bob Metcalfe stellte die Hypothese auf, dass der Wert eines Netzwerks proportional zum Quadrat der Anzahl der Benutzer wächst, da dies näherungsweise der Anzahl möglicher Verbindungen zwischen den Teilnehmern entspricht.",
    sourceRef: "computer-networks-tanenbaum-5th-edition.md",
  },
  {
    id: "rn1-rechenzentrumsnetzwerke",
    courseId: "rechnernetze",
    chapter: 1,
    chapterTitle: "Netzstruktur & Übersicht",
    confidence: "low",
    mcqOptions: [
      { id: "rn1-rz-opt-a", text: "Rechenzentrumsnetzwerke sind hauptsächlich für die Speicherung von Daten ausgelegt.", correct: false },
      { id: "rn1-rz-opt-b", text: "Frühe Netzwerkdesigns basierten auf einer einfachen Baumtopologie.", correct: true },
      { id: "rn1-rz-opt-c", text: "Sie verbinden Hunderttausende oder Millionen von Servern an einem Standort.", correct: true },
      { id: "rn1-rz-opt-d", text: "Sie sind auf die Bewegung großer Datenmengen zwischen Servern im Rechenzentrum ausgelegt.", correct: true },
    ],
    question: "Welche Aussagen über Rechenzentrumsnetzwerke sind korrekt?",
    answer:
      "Rechenzentrumsnetzwerke verbinden sehr viele Server an einem Standort (Hunderttausende bis Millionen) und sind auf den Datentransfer zwischen diesen Servern optimiert. Frühe Designs nutzten eine einfache Baumtopologie; Speicherung ist nicht ihr Hauptzweck.",
    sourceRef: "computer-networks-tanenbaum-5th-edition.md",
  },
  {
    id: "rn1-drahtlos-mobil-zuordnung",
    courseId: "rechnernetze",
    chapter: 1,
    chapterTitle: "Netzstruktur & Übersicht",
    confidence: "low",
    mcqOptions: [
      { id: "rn1-dm-opt-a", text: "Laptop an der Netzwerkdose → nicht drahtlos, aber mobil", correct: false },
      { id: "rn1-dm-opt-b", text: "Laptop an der Netzwerkdose → nicht drahtlos und nicht mobil", correct: true },
      { id: "rn1-dm-opt-c", text: "Inventur mit Laptop → drahtlos und mobil", correct: true },
      { id: "rn1-dm-opt-d", text: "Netze in nicht verkabelten Gebäuden → drahtlos und nicht mobil", correct: true },
      { id: "rn1-dm-opt-e", text: "Traditioneller Desktop-PC im Büro → nicht drahtlos und nicht mobil", correct: true },
    ],
    question: "Ordnen Sie die Anwendungsfälle den Kombinationen aus drahtlos/mobil zu.",
    answer:
      "Ein Laptop an der Netzwerkdose ist weder drahtlos noch mobil; die Inventur mit Laptop ist drahtlos und mobil; Netze in nicht verkabelten Gebäuden sind drahtlos, aber nicht mobil; ein klassischer Desktop-PC ist weder drahtlos noch mobil.",
    sourceRef: "rng_260519.md",
  },

  // ─────────────── Kapitel RN 2 – Referenzmodelle (OSI / TCP-IP) ─────────

  {
    id: "rn2-osi-schichten-reihenfolge",
    courseId: "rechnernetze",
    chapter: 2,
    chapterTitle: "Referenzmodelle (OSI / TCP-IP)",
    confidence: "low",
    question: "Ordnen Sie die Schichten des ISO-OSI-Referenzmodells in absteigender Reihenfolge.",
    answer:
      "Von oben nach unten (Schicht 7 → 1): Anwendungsschicht, Darstellungsschicht, Sitzungsschicht, Transportschicht, Vermittlungsschicht, Sicherungsschicht, Bitübertragungsschicht.",
    sourceRef: "rng_260511.md",
  },
  {
    id: "rn2-osi-geraete-zuordnung",
    courseId: "rechnernetze",
    chapter: 2,
    chapterTitle: "Referenzmodelle (OSI / TCP-IP)",
    confidence: "low",
    mcqOptions: [
      { id: "rn2-osimc-opt-a", text: "Repeater → Bitübertragungsschicht", correct: true },
      { id: "rn2-osimc-opt-b", text: "Hub → Bitübertragungsschicht", correct: true },
      { id: "rn2-osimc-opt-c", text: "Bridge → Sicherungsschicht", correct: true },
      { id: "rn2-osimc-opt-d", text: "Switch → Sicherungsschicht", correct: true },
      { id: "rn2-osimc-opt-e", text: "Router → Vermittlungsschicht", correct: true },
      { id: "rn2-osimc-opt-f", text: "Transport-Gateway → Transportschicht", correct: true },
      { id: "rn2-osimc-opt-g", text: "Application-Gateway → Anwendungsschicht", correct: true },
      { id: "rn2-osimc-opt-h", text: "Router → Transportschicht", correct: false },
      { id: "rn2-osimc-opt-i", text: "Hub → Vermittlungsschicht", correct: false },
    ],
    question: "Ordnen Sie die Geräte den Schichten des OSI-Modells zu.",
    answer:
      "Repeater und Hub arbeiten auf der Bitübertragungsschicht (Layer 1), Bridge und Switch auf der Sicherungsschicht (Layer 2), Router auf der Vermittlungsschicht (Layer 3). Transport-Gateways ordnet man der Transportschicht (Layer 4), Application-Gateways der Anwendungsschicht (Layer 7) zu.",
    sourceRef: "rng_260511.md",
  },
  {
    id: "rn2-tcpip-route-schicht",
    courseId: "rechnernetze",
    chapter: 2,
    chapterTitle: "Referenzmodelle (OSI / TCP-IP)",
    confidence: "low",
    question: "Welche Schicht im TCP/IP-Modell ist zuständig für die Festlegung einer Route?",
    answer:
      "Die Vermittlungsschicht (Internet-Schicht / Internet Layer) des TCP/IP-Modells ist für die Weiterleitung und die Festlegung der Route (Routing) zuständig. Sie entspricht der OSI-Schicht 3.",
    sourceRef: "rng_260511.md",
  },
  {
    id: "rn2-tcpip-frames-schicht",
    courseId: "rechnernetze",
    chapter: 2,
    chapterTitle: "Referenzmodelle (OSI / TCP-IP)",
    confidence: "low",
    question: "Welche TCP/IP-Schicht ist zuständig für die Aufteilung eines Datenstroms in Frames?",
    answer:
      "Die Netzzugangsschicht (Link Layer) ist für die Kapselung von Paketen in Frames zuständig. Sie entspricht den OSI-Schichten 1 und 2.",
    sourceRef: "rng_260511.md",
  },
  {
    id: "rn2-osi-tcpip-zuordnung",
    courseId: "rechnernetze",
    chapter: 2,
    chapterTitle: "Referenzmodelle (OSI / TCP-IP)",
    confidence: "low",
    mcqOptions: [
      { id: "rn2-osi2tcp-opt-a", text: "Application (OSI 7) → Application (TCP/IP)", correct: true },
      { id: "rn2-osi2tcp-opt-b", text: "Presentation (OSI 6) → Application (TCP/IP)", correct: true },
      { id: "rn2-osi2tcp-opt-c", text: "Session (OSI 5) → Application (TCP/IP)", correct: true },
      { id: "rn2-osi2tcp-opt-d", text: "Transport (OSI 4) → Transport (TCP/IP)", correct: true },
      { id: "rn2-osi2tcp-opt-e", text: "Network (OSI 3) → Internet (TCP/IP)", correct: true },
      { id: "rn2-osi2tcp-opt-f", text: "Data Link (OSI 2) → Link (TCP/IP)", correct: true },
      { id: "rn2-osi2tcp-opt-g", text: "Physical (OSI 1) → Link (TCP/IP)", correct: true },
    ],
    question: "Ordnen Sie die Schichten des ISO-OSI-Modells denen des TCP/IP-Modells zu.",
    answer:
      "Application, Presentation und Session (OSI 5–7) werden zur Application-Schicht des TCP/IP-Modells zusammengefasst; Transport (OSI 4) bleibt Transport; Network (OSI 3) wird Internet; Data Link (OSI 2) und Physical (OSI 1) werden zur Link-Schicht zusammengefasst.",
    sourceRef: "rng_260511.md",
  },
  {
    id: "rn2-tcpip-protokolle-zuordnung",
    courseId: "rechnernetze",
    chapter: 2,
    chapterTitle: "Referenzmodelle (OSI / TCP-IP)",
    confidence: "low",
    mcqOptions: [
      { id: "rn2-proto-opt-a", text: "HTTP → Application", correct: true },
      { id: "rn2-proto-opt-b", text: "DNS → Application", correct: true },
      { id: "rn2-proto-opt-c", text: "SMTP → Application", correct: true },
      { id: "rn2-proto-opt-d", text: "TCP → Transport", correct: true },
      { id: "rn2-proto-opt-e", text: "UDP → Transport", correct: true },
      { id: "rn2-proto-opt-f", text: "RTP → Transport", correct: true },
      { id: "rn2-proto-opt-g", text: "IP → Internet", correct: true },
      { id: "rn2-proto-opt-h", text: "ICMP → Internet", correct: true },
      { id: "rn2-proto-opt-i", text: "Ethernet → Link", correct: true },
      { id: "rn2-proto-opt-j", text: "DSL → Link", correct: true },
      { id: "rn2-proto-opt-k", text: "SONET → Link", correct: true },
      { id: "rn2-proto-opt-l", text: "802.11 → Link", correct: true },
      { id: "rn2-proto-opt-m", text: "IP → Transport", correct: false },
      { id: "rn2-proto-opt-n", text: "802.11 → Internet", correct: false },
    ],
    question: "Ordnen Sie die Protokolle den Schichten im TCP/IP-Modell zu.",
    answer:
      "Application: HTTP, DNS, SMTP. Transport: TCP, UDP, RTP. Internet: IP, ICMP. Link: Ethernet, DSL, SONET, 802.11. ICMP arbeitet direkt auf IP und wird deshalb zur Internet-Schicht gezählt.",
    sourceRef: "rng_260511.md",
  },
  {
    id: "rn2-header-overhead-rechnung",
    courseId: "rechnernetze",
    chapter: 2,
    chapterTitle: "Referenzmodelle (OSI / TCP-IP)",
    confidence: "low",
    question:
      "Ein 5-Schichten-Modell: Anwendungen erzeugen Nachrichten von 10 Bytes, jede Schicht fügt 2 Bytes Header hinzu. Wie viel Prozent der Übertragungskapazität gehen durch Header verloren (ohne Fragmentierung/Aggregation)?",
    answer:
      "Pro Nachricht entstehen 5 × 2 = 10 Bytes Header bei 10 Bytes Nutzdaten, also 10 von insgesamt 20 Bytes = 50 % Header-Overhead. (Prüfungsformat: ohne Nachkommastellen → 50.)",
    sourceRef: "rng_260511.md",
  },

  // ─────────────── Kapitel RN 3 – Bitübertragung & Anschlussnetze ────────

  {
    id: "rn3-wifi-standard",
    courseId: "rechnernetze",
    chapter: 3,
    chapterTitle: "Bitübertragung & Anschlussnetze",
    confidence: "low",
    mcqOptions: [
      { id: "rn3-wifi-opt-a", text: "IEEE 802.11", correct: true },
      { id: "rn3-wifi-opt-b", text: "IEEE 802.17", correct: false },
      { id: "rn3-wifi-opt-c", text: "Ethernet", correct: false },
      { id: "rn3-wifi-opt-d", text: "IEEE 802.15", correct: false },
      { id: "rn3-wifi-opt-e", text: "IEEE 802.5", correct: false },
      { id: "rn3-wifi-opt-f", text: "Bluetooth", correct: false },
    ],
    question: "Welcher Standard für drahtlose LANs wird allgemein als WiFi bezeichnet?",
    answer:
      "WiFi bezeichnet die WLAN-Standards der Familie IEEE 802.11. (Bluetooth gehört zu 802.15, Token Ring zu 802.5, Resilient Packet Ring zu 802.17.)",
    sourceRef: "rng_260519.md",
  },
  {
    id: "rn3-vlan-gruende",
    courseId: "rechnernetze",
    chapter: 3,
    chapterTitle: "Bitübertragung & Anschlussnetze",
    confidence: "low",
    mcqOptions: [
      { id: "rn3-vlan-opt-a", text: "VLANs ermöglichen es, das Netz logisch zu segmentieren, ohne die physische Verkabelung zu ändern.", correct: true },
      { id: "rn3-vlan-opt-b", text: "VLANs erhöhen die Sicherheit durch Isolierung bestimmter Benutzergruppen und Daten.", correct: true },
      { id: "rn3-vlan-opt-c", text: "VLANs erleichtern die Verwaltung nach organisatorischer Struktur.", correct: true },
      { id: "rn3-vlan-opt-d", text: "VLANs begrenzen Broadcast-Verkehr auf einzelne VLANs und helfen gegen Broadcast-Stürme.", correct: true },
      { id: "rn3-vlan-opt-e", text: "VLANs gruppieren Geräte zwingend nach physischer Lage, unabhängig von der Organisationseinheit.", correct: false },
      { id: "rn3-vlan-opt-f", text: "VLANs verringern die Notwendigkeit von Switches und Routern.", correct: false },
    ],
    question: "Welche Gründe sind typisch für den Einsatz von VLANs in Netzwerken?",
    answer:
      "VLANs segmentieren das Netz logisch ohne Änderung der Verkabelung, erhöhen die Sicherheit durch Isolierung, erleichtern die Verwaltung nach Organisationseinheiten und begrenzen Broadcast-Domänen. Sie gruppieren nicht nach physischer Lage und ersetzen keine Switches/Router.",
    sourceRef: "rng_260617.md",
  },
  {
    id: "rn3-pon-aussagen",
    courseId: "rechnernetze",
    chapter: 3,
    chapterTitle: "Bitübertragung & Anschlussnetze",
    confidence: "low",
    mcqOptions: [
      { id: "rn3-pon-opt-a", text: "In Upstream-Richtung ist eine zeitsynchrone Übertragung erforderlich, um Kollisionen zu vermeiden.", correct: true },
      { id: "rn3-pon-opt-b", text: "In Downstream-Richtung wird das Signal durch optische Splitter aufgeteilt.", correct: true },
      { id: "rn3-pon-opt-c", text: "Für die Upstream-Übertragung wird eine von allen Teilnehmern geteilte Wellenlänge verwendet.", correct: true },
      { id: "rn3-pon-opt-d", text: "Die Glasfaser-TAL ist passiv, sodass keine stromversorgten Geräte zur Signalverstärkung nötig sind.", correct: true },
      { id: "rn3-pon-opt-e", text: "In Downstream-Richtung werden optische Kombinierer eingesetzt.", correct: false },
    ],
    question: "Welche Aussagen zu PON (Passive Optical Network) sind korrekt?",
    answer:
      "Bei einem PON ist die Teilnehmeranschlussleitung passiv (nur Splitter, keine aktiven Verstärker). Downstream wird das Signal über Splitter verteilt, Upstream nutzt eine gemeinsame Wellenlänge und erfordert zeitsynchrone Übertragung zur Kollisionsvermeidung. Optische Kombinierer gehören nicht zum PON (Splitter, nicht Kombinierer).",
    sourceRef: "rng_260608.md",
  },
  {
    id: "rn3-ip-ethernet-unterschied",
    courseId: "rechnernetze",
    chapter: 3,
    chapterTitle: "Bitübertragung & Anschlussnetze",
    confidence: "low",
    question:
      "IP-Adressen beinhalten die Angabe des Netzwerks, Ethernet-Adressen tun dies nicht. Warum?",
    answer:
      "IP-Adressen sind logische, hierarchische Adressen mit einem Netzwerkanteil (Präfix) und einem Host-Anteil; sie erlauben Routing über mehrere Netze. Ethernet-Adressen (MAC) sind flache, hardwarenahe Adressen, die nur einen Knoten auf einem gemeinsamen physikalischen Medium identifizieren – sie enthalten keinen Netzwerkanteil, denn das Netz ergibt sich aus dem Medium selbst (Broadcast-Domain).",
    sourceRef: "rng_260617.md",
  },
  {
    id: "rn3-ipv6-komprimierung",
    courseId: "rechnernetze",
    chapter: 3,
    chapterTitle: "Bitübertragung & Anschlussnetze",
    confidence: "low",
    question:
      "Geben Sie die IPv6-Adresse 2001:0db8:0000:0000:b450:0000:0000:00b4 in komprimierter Form an.",
    answer:
      "2001:db8::b450:0:0:b4. Regeln: führende Nullen jedes Blocks entfallen; die längste Folge aufeinanderfolgender Null-Blöcke wird durch „::“ ersetzt (nur einmal erlaubt). Hier werden damit die Blöcke 3 und 4 zusammengefasst; die weiteren Null-Blöcke bleiben als „0“ stehen, da „::“ nur einmal verwendet werden darf.",
    sourceRef: "rng_260629.md",
  },
  {
    id: "rn3-ipv4-in-ipv6",
    courseId: "rechnernetze",
    chapter: 3,
    chapterTitle: "Bitübertragung & Anschlussnetze",
    confidence: "low",
    question: "Geben Sie die IPv4-Adresse 192.31.20.46 in IPv6-Notation an.",
    answer:
      "::ffff:192.31.20.46 (IPv4-mapped-IPv6-Adresse) oder alternativ ::192.31.20.46. Schreibweise mit eingebetteter IPv4-Dotted-Decimal-Darstellung in den letzten 32 Bit.",
    sourceRef: "rng_260629.md",
  },
  {
    id: "rn3-atm-zellen-rechnung",
    courseId: "rechnernetze",
    chapter: 3,
    chapterTitle: "Bitübertragung & Anschlussnetze",
    confidence: "low",
    question:
      "Ein 96 Byte großes IP-Paket soll mit ATM über ADSL transportiert werden. Wie viele ATM-Zellen werden benötigt?",
    answer:
      "Eine ATM-Zelle transportiert 48 Byte Nutzlast. Für 96 Byte benötigt man ⌈96/48⌉ = 2 ATM-Zellen (AAL5-Encapsulation wird hier vernachlässigt).",
    sourceRef: "rng_260608.md",
  },

  // ─────────────── Kapitel RN 4 – Sicherungsschicht & MAC ────────────────

  {
    id: "rn4-byte-stuffing-beispiel",
    courseId: "rechnernetze",
    chapter: 4,
    chapterTitle: "Sicherungsschicht & MAC",
    confidence: "low",
    question:
      "Datenstrom: A B ESC C ESC FLAG FLAG D. Geben Sie den Datenstrom nach Stopfen auf Byte-Ebene an.",
    answer:
      "A B ESC ESC C ESC ESC ESC FLAG ESC FLAG D. Beim Byte-Stuffing wird jedes vorkommende ESC durch ESC ESC und jedes FLAG durch ESC FLAG verdoppelt, damit FLAG nur noch als Begrenzer auftritt.",
    sourceRef: "rng_260605.md",
  },
  {
    id: "rn4-byte-stuffing-overhead",
    courseId: "rechnernetze",
    chapter: 4,
    chapterTitle: "Sicherungsschicht & MAC",
    confidence: "low",
    question: "Wie groß ist der maximale Overhead bei Byte Stuffing in Prozent?",
    answer:
      "Der maximale Overhead beträgt 100 %: Im ungünstigsten Fall besteht die Nutzlast ausschließlich aus Zeichen, die gestopft werden müssen (ESC oder FLAG), wobei jedes Zeichen verdoppelt wird – die Datenmenge kann sich also höchstens verdoppeln.",
    sourceRef: "rng_260605.md",
  },
  {
    id: "rn4-hdlc-enstopfen",
    courseId: "rechnernetze",
    chapter: 4,
    chapterTitle: "Sicherungsschicht & MAC",
    confidence: "low",
    question:
      "Enstopfen Sie die HDLC-Sequenz 0110 0111 11 / 0 1111 0111 11 / 1 (Bitfolge ohne Trennzeichen angeben).",
    answer:
      "0110011111011110111111. Beim HDLC-Bit-Stuffing wird nach fünf aufeinanderfolgenden Einsen ein eingefügtes Null-Bit entfernt; die Begrenzer-Flags (01111110) am Anfang/Ende entfallen in der Enstopfung.",
    sourceRef: "rng_260605.md",
  },
  {
    id: "rn4-ppp-frame-reihenfolge",
    courseId: "rechnernetze",
    chapter: 4,
    chapterTitle: "Sicherungsschicht & MAC",
    confidence: "low",
    question: "Bringen Sie die Elemente eines PPP-Frames in die übertragungsgerechte Reihenfolge.",
    answer:
      "Flag – Address – Control – Protocol – Payload – Checksum (FCS) – Flag. Ein PPP-Frame beginnt und endet mit dem Flag (01111110), gefolgt von Address, Control, dem Protocol-Feld, den Nutzdaten, der Prüfsumme und erneut dem Flag.",
    sourceRef: "rng_260608.md",
  },
  {
    id: "rn4-csma-vs-aloha",
    courseId: "rechnernetze",
    chapter: 4,
    chapterTitle: "Sicherungsschicht & MAC",
    confidence: "low",
    question:
      "Warum ermöglicht CSMA eine effizientere Kanalauslastung als ALOHA? Geben Sie ein konkretes Beispiel.",
    answer:
      "Bei CSMA hört der Sender vor dem Senden den Kanal ab („listen before talk“) und überträgt erst, wenn der Kanal frei ist – dadurch werden viele Kollisionen im Voraus vermieden, während ALOHA blind sendet. Beispiel: Bei 1-persistent CSMA senden mehrere Stationen nur nach Freisein des Kanals; die Auslastung steigt gegenüber ALOHA (Smax ≈ 18 % Pure, ≈ 37 % Slotted) deutlich an.",
    sourceRef: "rng_260617.md",
  },
  {
    id: "rn4-can-arbitration",
    courseId: "rechnernetze",
    chapter: 4,
    chapterTitle: "Sicherungsschicht & MAC",
    confidence: "low",
    question:
      "Ein Kanal verknüpft Bits nach Art eines Booleschen ODER. Vier Teilnehmer mit Adressen 0011, 0100, 1001, 1010 greifen gleichzeitig zu. Eine logische Eins setzt sich durch. Welcher Teilnehmer erhält den Zugriff?",
    answer:
      "Teilnehmer mit Adresse 1010. Bei bitweiser ODER-Verknüpfung setzt sich die jeweils höhere Adresse durch (die dominante Eins gewinnt pro Bitposition). 1010 ist hier die höchste Adresse und setzt sich in jeder Bitposition gegen die anderen durch.",
    sourceRef: "rng_260605.md",
  },

  // ─────────────── Kapitel RN 5 – Vermittlungsschicht & IP ───────────────

  {
    id: "rn5-subnetz-hostzahl",
    courseId: "rechnernetze",
    chapter: 5,
    chapterTitle: "Vermittlungsschicht & IP",
    confidence: "low",
    question:
      "Ein Netz hat die Subnetzmaske 255.255.240.0. Wie viele Hosts passen in das Netz?",
    answer:
      "255.255.240.0 = /20, also 32 – 20 = 12 Host-Bits. Anzahl Hosts = 2^12 – 2 = 4094 (abzüglich Netz- und Broadcast-Adresse).",
    sourceRef: "rng_260629.md",
  },
  {
    id: "rn5-datagram-netzwerke",
    courseId: "rechnernetze",
    chapter: 5,
    chapterTitle: "Vermittlungsschicht & IP",
    confidence: "low",
    mcqOptions: [
      { id: "rn5-dg-opt-a", text: "Router treffen Entscheidungen basierend auf der Zieladresse in jedem Paket.", correct: true },
      { id: "rn5-dg-opt-b", text: "Daten werden in diskreten Paketen übertragen.", correct: true },
      { id: "rn5-dg-opt-c", text: "Datagram-Netzwerke sind skalierbar und können viele Benutzer unterstützen.", correct: true },
      { id: "rn5-dg-opt-d", text: "Datagram-Netzwerke bieten verbindungsorientierte Kommunikation.", correct: false },
      { id: "rn5-dg-opt-e", text: "Es gibt eine Garantie für die Zustellung der Pakete in der richtigen Reihenfolge.", correct: false },
      { id: "rn5-dg-opt-f", text: "Router speichern Zustandsinformationen über aktive Verbindungen.", correct: false },
    ],
    question: "Welche Aussagen beschreiben korrekt die Eigenschaften klassischer Datagram-Netzwerke?",
    answer:
      "Datagram-Netzwerke sind verbindungslos: Daten werden in diskreten Paketen übertragen, jeder Router entscheidet pro Paket anhand der Zieladresse. Sie sind skalierbar und verwalten keinen Verbindungs-Zustand auf den Routern. Eine Zustellungsgarantie oder Reihenfolgegarantie gibt es nicht.",
    sourceRef: "rng_260629.md",
  },
  {
    id: "rn5-split-horizon",
    courseId: "rechnernetze",
    chapter: 5,
    chapterTitle: "Vermittlungsschicht & IP",
    confidence: "low",
    question:
      "Erklären Sie „Split Horizon with Poisoned Reverse“ als Lösung des Count-to-Infinity-Problems.",
    answer:
      "Beim Distance-Vector-Routing kann Count-to-Infinity entstehen, wenn ein Router einem Nachbarn eine Route zurückmeldet, die er gerade von diesem gelernt hat. Bei Split Horizon wird eine von Nachbar N gelernte Route in Updates an N ganz weggelassen (Simple Split Horizon). Bei „Poisoned Reverse“ wird sie stattdessen mit Metrik Unendlich zurückgemeldet, sodass N diesen Pfad nicht erneut nutzt. Das löst Schleifen zwischen zwei Routern, nicht aber generell bei drei und mehr.",
    sourceRef: "rng_260624.md",
  },
];