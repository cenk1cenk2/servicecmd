import { IBooleanFlag, IOptionFlag } from '@oclif/parser/lib/flags'

import { DockerCommandFlagsWithLimitationTypes } from './index.constants'
import { ServiceConfig } from '@context/config/services.interface'

export interface DockerCommandCtx {
  config: ServiceConfig
  command: DockerCommandsAvailableInterface
  services: string[]
  parsedServices: Record<string, string[]>
}

export type DockerCommandFlagsWithLimitationInterface = {
  name: DockerCommandFlagsWithLimitationTypes
  type: 'string' | 'boolean'
  argument: 'value-start' | 'with-double' | 'with-single' | 'with-double-and-value' | 'with-single-and-value' | 'value-end'
  useChar?: boolean
  description: string[]
  options?: Partial<IBooleanFlag<boolean> | IOptionFlag<any>>
}

export interface DockerCommandsAvailableInterface {
  command: string
  deffered?: boolean
  headless?: boolean
  limits?: {
    services: number
  }
  requireFlags?: DockerCommandFlagsWithLimitationTypes[]
  limitedFlags?: DockerCommandFlagsWithLimitationTypes[]
  keepOutput?: boolean
}
