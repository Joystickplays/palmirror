export function getDomainGuideSysInst(domainGuide: string) {
    return `
DOMAIN GUIDE

"""
${domainGuide}
"""

The above is additional instructions and context added by the user about the domain's world.
This could hold certain things that the automatic timestep/memory might miss, like:

- Important locations in the world
- Key characters and their relationships
- Recurring themes or motifs
- Specific terminology or jargon used in the domain

When generating responses, always prioritize this domain guide.
They override any conflicting information from other sources, including the base system instructions.
`
}