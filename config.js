// config.js
export const SUBMIT_URL = "https://script.google.com/macros/s/AKfycbxRgYjpKEQJiNoNdQIFxJ0uYl2maf9i2gnx8X7b7SIC0iBJ1u-UD_pCSn1Q77BwzZD-/exec";

export const QUIZ_VERSION = "perfil-do-dono-ranking-v1";

export const SEGMENTS = [
  "Restaurante / Food Service",
  "Cafeteria / Padaria",
  "Varejo (loja física)",
  "E-commerce",
  "Beleza (salão, estética, barbearia)",
  "Saúde (clínica, consultório)",
  "Odonto",
  "Pet (clínica/petshop)",
  "Academia / Fitness",
  "Imobiliária / Corretagem",
  "Construção / Arquitetura / Engenharia",
  "Contabilidade / Jurídico / Serviços profissionais",
  "Indústria",
  "Agro",
  "Escola / Educação",
  "Hotelaria / Turismo",
  "Oficina / Auto",
  "Outro (digitar)"
];

// 12 grupos x 4 adjetivos (1 D, 1 I, 1 S, 1 C por grupo)
export const GROUPS = [
  { id:"g1",  title:"sobre pressão", items:["Decidido","Comunicativo","Calmo","Detalhista"] },
  { id:"g2",  title:"quando surge um problema", items:["Direto","Carismático","Paciente","Preciso"] },
  { id:"g3",  title:"em sua rotina", items:["Acelerado","Entusiasmado","Constante","Organizado"] },
  { id:"g4",  title:"com mudanças e imprevistos", items:["Ousado","Flexível","Estável","Prudente"] },
  { id:"g5",  title:"ao comando do time", items:["Firme","Persuasivo","Empático","Racional"] },
  { id:"g6",  title:"para tomada de decisão", items:["Objetivo","Influente","Conciliador","Analítico"] },
  { id:"g7",  title:"com metas e resultados", items:["Competitivo","Motivador","Persistente","Disciplinado"] },
  { id:"g8",  title:"no relacionamento diário", items:["Independente","Sociável","Leal","Metódico"] },
  { id:"g9",  title:"no jeito de trabalhar", items:["Prático","Dinamico","Cooperativo","Controlador"] },
  { id:"g10", title:"com regras e padrões", items:["Mandão","Inspirador","Comedido","Criterioso"] },
  { id:"g11", title:"quando precisa vender uma ideia", items:["Corajoso","Convincente","Atencioso","Consistente"] },
  { id:"g12", title:"na execução e entrega", items:["Urgente","Extrovertido","Previsível","Planejador"] },
];

// 24 comportamentos oficiais (chaves para padronizar)
export const BEHAVIORS = [
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

// Mapa: adjetivo -> DISC + comportamentos (pesos)
// Regra: disc forte (1.0) + behavior principal (1.0) + secundário (0.6) quando fizer sentido
export const MAP = {
  // Grupo 1
  "Decidido":     { disc:{D:1.0}, behaviors:{ "Comando e firmeza":1.0, "Objetividade":0.6 } },
  "Comunicativo": { disc:{I:1.0}, behaviors:{ "Sociabilidade":1.0, "Extroversão":0.6 } },
  "Calmo":        { disc:{S:1.0}, behaviors:{ "Estabilidade":1.0, "Paciência":0.6 } },
  "Detalhista":   { disc:{C:1.0}, behaviors:{ "Detalhismo":1.0, "Concentração e precisão":0.6 } },

  // Grupo 2
  "Direto":       { disc:{D:1.0}, behaviors:{ "Objetividade":1.0, "Comando e firmeza":0.6 } },
  "Carismático":  { disc:{I:1.0}, behaviors:{ "Carisma":1.0, "Persuasão":0.6 } },
  "Paciente":     { disc:{S:1.0}, behaviors:{ "Paciência":1.0, "Conciliação e consentimento":0.6 } },
  "Preciso":      { disc:{C:1.0}, behaviors:{ "Concentração e precisão":1.0, "Detalhismo":0.6 } },

  // Grupo 3
  "Acelerado":    { disc:{D:1.0}, behaviors:{ "Senso de urgência":1.0, "Dinamismo":0.6 } },
  "Entusiasmado": { disc:{I:1.0}, behaviors:{ "Entusiasmo e motivação":1.0, "Dinamismo":0.6 } },
  "Constante":    { disc:{S:1.0}, behaviors:{ "Persistência":1.0, "Estabilidade":0.6 } },
  "Organizado":   { disc:{C:1.0}, behaviors:{ "Organização e controle":1.0, "Planejamento":0.6 } },

  // Grupo 4
  "Ousado":       { disc:{D:1.0}, behaviors:{ "Ousadia":1.0, "Independência":0.6 } },
  "Flexível":     { disc:{I:1.0}, behaviors:{ "Flexibilidade com mudanças":1.0, "Entusiasmo e motivação":0.6 } },
  "Estável":      { disc:{S:1.0}, behaviors:{ "Estabilidade":1.0, "Persistência":0.6 } },
  "Prudente":     { disc:{C:1.0}, behaviors:{ "Prudência":1.0, "Racionalidade":0.6 } },

  // Grupo 5
  "Firme":        { disc:{D:1.0}, behaviors:{ "Comando e firmeza":1.0, "Senso de urgência":0.6 } },
  "Persuasivo":   { disc:{I:1.0}, behaviors:{ "Persuasão":1.0, "Carisma":0.6 } },
  "Empático":     { disc:{S:1.0}, behaviors:{ "Empatia":1.0, "Conciliação e consentimento":0.6 } },
  "Racional":     { disc:{C:1.0}, behaviors:{ "Racionalidade":1.0, "Prudência":0.6 } },

  // Grupo 6
  "Objetivo":     { disc:{D:1.0}, behaviors:{ "Objetividade":1.0, "Senso de urgência":0.6 } },
  "Influente":    { disc:{I:1.0}, behaviors:{ "Persuasão":1.0, "Sociabilidade":0.6 } },
  "Conciliador":  { disc:{S:1.0}, behaviors:{ "Conciliação e consentimento":1.0, "Empatia":0.6 } },
  "Analítico":    { disc:{C:1.0}, behaviors:{ "Planejamento":1.0, "Racionalidade":0.6 } },

  // Grupo 7
  "Competitivo":  { disc:{D:1.0}, behaviors:{ "Comando e firmeza":1.0, "Senso de urgência":0.6 } },
  "Motivador":    { disc:{I:1.0}, behaviors:{ "Entusiasmo e motivação":1.0, "Carisma":0.6 } },
  "Persistente":  { disc:{S:1.0}, behaviors:{ "Persistência":1.0, "Estabilidade":0.6 } },
  "Disciplinado": { disc:{C:1.0}, behaviors:{ "Disciplina":1.0, "Organização e controle":0.6 } },

  // Grupo 8
  "Independente": { disc:{D:1.0}, behaviors:{ "Independência":1.0, "Ousadia":0.6 } },
  "Sociável":     { disc:{I:1.0}, behaviors:{ "Sociabilidade":1.0, "Extroversão":0.6 } },
  "Leal":         { disc:{S:1.0}, behaviors:{ "Estabilidade":1.0, "Persistência":0.6 } },
  "Metódico":     { disc:{C:1.0}, behaviors:{ "Organização e controle":1.0, "Disciplina":0.6 } },

  // Grupo 9
  "Prático":      { disc:{D:1.0}, behaviors:{ "Objetividade":1.0, "Senso de urgência":0.6 } },
  "Dinamico":     { disc:{I:1.0}, behaviors:{ "Dinamismo":1.0, "Entusiasmo e motivação":0.6 } },
  "Cooperativo":  { disc:{S:1.0}, behaviors:{ "Empatia":1.0, "Conciliação e consentimento":0.6 } },
  "Controlador":  { disc:{C:1.0}, behaviors:{ "Organização e controle":1.0, "Detalhismo":0.6 } },

  // Grupo 10
  "Mandão":       { disc:{D:1.0}, behaviors:{ "Comando e firmeza":1.0, "Independência":0.6 } },
  "Inspirador":   { disc:{I:1.0}, behaviors:{ "Carisma":1.0, "Entusiasmo e motivação":0.6 } },
  "Comedido":     { disc:{S:1.0}, behaviors:{ "Paciência":1.0, "Estabilidade":0.6 } },
  "Criterioso":   { disc:{C:1.0}, behaviors:{ "Prudência":1.0, "Concentração e precisão":0.6 } },

  // Grupo 11
  "Corajoso":     { disc:{D:1.0}, behaviors:{ "Ousadia":1.0, "Independência":0.6 } },
  "Convincente":  { disc:{I:1.0}, behaviors:{ "Persuasão":1.0, "Carisma":0.6 } },
  "Atencioso":    { disc:{S:1.0}, behaviors:{ "Empatia":1.0, "Sociabilidade":0.6 } },
  "Consistente":  { disc:{C:1.0}, behaviors:{ "Disciplina":1.0, "Planejamento":0.6 } },

  // Grupo 12
  "Urgente":      { disc:{D:1.0}, behaviors:{ "Senso de urgência":1.0, "Dinamismo":0.6 } },
  "Extrovertido": { disc:{I:1.0}, behaviors:{ "Extroversão":1.0, "Sociabilidade":0.6 } },
  "Previsível":   { disc:{S:1.0}, behaviors:{ "Estabilidade":1.0, "Organização e controle":0.6 } },
  "Planejador":   { disc:{C:1.0}, behaviors:{ "Planejamento":1.0, "Organização e controle":0.6 } },
};
