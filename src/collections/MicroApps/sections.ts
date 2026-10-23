import { defineSection } from '../../content/sections/defineSection'

/**
 * Sections only the Bot swarm collection allows (micro_apps_swarm.md
 * section 9, agent page layout).
 */

export const agentPanelSection = defineSection({
  key: 'agentPanel',
  label: 'Agent panel (five steps)',
  reads: ['startsWhen', 'customerSees', 'hears', 'checks', 'acts', 'handsOver', 'records'],
  requiredWhenOn: ['hears', 'checks', 'acts', 'handsOver', 'records'],
  headingDefault: 'What {name} does, step by step',
})

// Also reads the agents whose passesTo includes this one. An agent with no
// chain either way has no chain section, so nothing is required.
export const agentChainSection = defineSection({
  key: 'agentChain',
  label: 'Agent chain',
  reads: ['passesTo'],
  requiredWhenOn: [],
  headingDefault: 'Where it sits in the swarm',
})

export const agentTeamControlsSection = defineSection({
  key: 'agentTeamControls',
  label: 'What your team controls',
  reads: ['teamControls'],
  requiredWhenOn: ['teamControls'],
  headingDefault: 'What your team controls',
})

// The brief: proof must be confirmed before an agent gets its own page.
export const agentResultSection = defineSection({
  key: 'agentResult',
  label: 'Result and proof',
  reads: ['result', 'proof', 'customers'],
  requiredWhenOn: ['result', 'proof'],
  headingDefault: 'What changes for your team',
})
