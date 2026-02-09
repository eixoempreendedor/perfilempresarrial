const SUBMIT_URL = "https://script.google.com/macros/s/SEU_SCRIPT_ID/exec";
const QUIZ_VERSION = "v1.0.0-ranking";

const SEGMENTS = [
  "Tecnologia",
  "Varejo",
  "Serviços",
  "Indústria",
  "Saúde",
  "Educação",
  "Alimentação",
  "Financeiro",
  "Marketing/Agência",
  "Outro",
];

const BEHAVIORS = [
  "Persistência",
  "Planejamento",
  "Organização e controle",
  "Detalhismo",
  "Disciplina",
  "Comando e firmeza",
  "Senso de urgência",
  "Flexibilidade com mudanças",
  "Entusiasmo e motivação",
  "Persuasão",
  "Concentração e precisão",
  "Sociabilidade",
  "Objetividade",
  "Ousadia",
  "Carisma",
  "Paciência",
  "Prudência",
  "Dinamismo",
  "Empatia",
  "Conciliação e consentimento",
  "Estabilidade",
  "Racionalidade",
  "Independência",
  "Extroversão",
];

const GROUPS = [
  ["Objetivo", "Comunicativo", "Paciente", "Analítico"],
  ["Ousado", "Empático", "Disciplinado", "Persuasivo"],
  ["Prudente", "Dinâmico", "Conciliador", "Detalhista"],
  ["Independente", "Carismático", "Estável", "Racional"],
  ["Comandante", "Entusiasmado", "Organizado", "Flexível"],
  ["Urgente", "Sociável", "Planejado", "Concentrado"],
  ["Persistente", "Extrovertido", "Cooperativo", "Preciso"],
  ["Assertivo", "Motivador", "Metódico", "Calmo"],
  ["Firme", "Criativo", "Leal", "Criterioso"],
  ["Competitivo", "Inspirador", "Cuidadoso", "Estruturado"],
];

const MAP = {
  Objetivo: { disc: "D", behaviors: ["Objetividade"] },
  Comunicativo: { disc: "I", behaviors: ["Sociabilidade", "Extroversão"] },
  Paciente: { disc: "S", behaviors: ["Paciência", "Estabilidade"] },
  Analítico: { disc: "C", behaviors: ["Racionalidade", "Concentração e precisão"] },

  Ousado: { disc: "D", behaviors: ["Ousadia", "Dinamismo"] },
  Empático: { disc: "S", behaviors: ["Empatia", "Conciliação e consentimento"] },
  Disciplinado: { disc: "C", behaviors: ["Disciplina", "Organização e controle"] },
  Persuasivo: { disc: "I", behaviors: ["Persuasão", "Carisma"] },

  Prudente: { disc: "C", behaviors: ["Prudência"] },
  Dinâmico: { disc: "D", behaviors: ["Dinamismo", "Senso de urgência"] },
  Conciliador: { disc: "S", behaviors: ["Conciliação e consentimento", "Empatia"] },
  Detalhista: { disc: "C", behaviors: ["Detalhismo", "Concentração e precisão"] },

  Independente: { disc: "D", behaviors: ["Independência"] },
  Carismático: { disc: "I", behaviors: ["Carisma", "Entusiasmo e motivação"] },
  Estável: { disc: "S", behaviors: ["Estabilidade"] },
  Racional: { disc: "C", behaviors: ["Racionalidade", "Planejamento"] },

  Comandante: { disc: "D", behaviors: ["Comando e firmeza"] },
  Entusiasmado: { disc: "I", behaviors: ["Entusiasmo e motivação", "Extroversão"] },
  Organizado: { disc: "C", behaviors: ["Organização e controle", "Planejamento"] },
  Flexível: { disc: "S", behaviors: ["Flexibilidade com mudanças"] },

  Urgente: { disc: "D", behaviors: ["Senso de urgência", "Objetividade"] },
  Sociável: { disc: "I", behaviors: ["Sociabilidade", "Extroversão"] },
  Planejado: { disc: "C", behaviors: ["Planejamento", "Disciplina"] },
  Concentrado: { disc: "C", behaviors: ["Concentração e precisão", "Detalhismo"] },

  Persistente: { disc: "D", behaviors: ["Persistência"] },
  Extrovertido: { disc: "I", behaviors: ["Extroversão", "Carisma"] },
  Cooperativo: { disc: "S", behaviors: ["Conciliação e consentimento", "Empatia"] },
  Preciso: { disc: "C", behaviors: ["Concentração e precisão", "Detalhismo"] },

  Assertivo: { disc: "D", behaviors: ["Comando e firmeza", "Objetividade"] },
  Motivador: { disc: "I", behaviors: ["Entusiasmo e motivação", "Persuasão"] },
  Metódico: { disc: "C", behaviors: ["Planejamento", "Disciplina"] },
  Calmo: { disc: "S", behaviors: ["Paciência", "Estabilidade"] },

  Firme: { disc: "D", behaviors: ["Comando e firmeza", "Persistência"] },
  Criativo: { disc: "I", behaviors: ["Dinamismo", "Ousadia"] },
  Leal: { disc: "S", behaviors: ["Estabilidade", "Empatia"] },
  Criterioso: { disc: "C", behaviors: ["Prudência", "Racionalidade"] },

  Competitivo: { disc: "D", behaviors: ["Ousadia", "Independência"] },
  Inspirador: { disc: "I", behaviors: ["Carisma", "Persuasão"] },
  Cuidadoso: { disc: "S", behaviors: ["Prudência", "Paciência"] },
  Estruturado: { disc: "C", behaviors: ["Organização e controle", "Detalhismo"] },
};
