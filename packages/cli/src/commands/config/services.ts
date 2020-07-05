import { ConfigBaseCommand, promptUser, createTable } from '@cenk1cenk2/boilerplate-oclif'
import chalk from 'chalk'

import { ServiceConfig, ServiceProperties, ServicePrompt } from '@context/config/services.interface'

export default class ConfigCommand extends ConfigBaseCommand {
  static description = 'Edit services that is managed by this CLI.'
  protected configName = 'services.servicecmd.yml'
  protected configType: 'general' = 'general'

  async configAdd (config: ServiceConfig): Promise<ServiceConfig> {
    // prompt user for details
    const response = await promptUser<ServiceProperties>({
      type: 'Form',
      message: 'Please provide the details for service.',
      choices: [
        {
          name: 'path',
          message: 'Path',
          required: true
        },
        {
          name: 'name',
          message: 'Name'
        }
      ],
      // FIXME: fix this later with the types on listr2
      // @ts-ignore
      footer: chalk.italic.dim(
        // eslint-disable-next-line max-len
        'Path can be a absolute value, relative to default directory or a regular expression. Regular expressions can be in gitignore format seperated by colons. Name is a alias to call services from the CLI directly. Elsewise it will be defaulting to the path.'
      ),
      validate: (value) => this.validate(config, value) as Promise<string>,
      result: (value) => this.result(config, value)
    })

    if (response) {
      config[response?.name] = Object.keys(response).reduce((o, key) => {
        o[key] = response[key]
        return o
      }, {} as ServiceProperties)

      this.logger.success(`Added "${response.name}" to the local configuration.`)
    }

    return config
  }

  async configEdit (config: ServiceConfig): Promise<ServiceConfig> {
    // prompt user for which keys to edit
    const select = await promptUser({
      type: 'Select',
      message: 'Please select configuration to edit.',
      choices: Object.keys(config)
    })

    const edit = await promptUser({
      type: 'Form',
      message: 'Please provide the details for repository below.',
      choices: [
        {
          name: 'value',
          message: 'Repository',
          initial: config[select]
        },
        {
          name: 'name',
          message: 'Name',
          initial: select
        }
      ],
      validate: (value) => this.validate(config, value) as Promise<string>,
      result: (value) => this.result(config, value)
    })

    // strip old item
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
    const { [select]: omit, ...rest } = config

    // write to temp
    rest[edit.name] = edit.value
    this.logger.success(`Edited "${select}" with "${edit.name}@${edit.value}" in the local configuration.`)

    return rest
  }

  public async configShow (config: ServiceConfig): Promise<void> {
    if (Object.keys(config).length > 0) {
      this.logger.info(
        createTable(
          [ 'Name', 'Path' ],
          Object.values(config).reduce((o, entry) => {
            return [ ...o, [ entry.name, entry.path.toString() ] ]
          }, [])
        )
      )
      this.logger.module('Configuration file is listed.')
    } else {
      this.logger.warn('Configuration file is empty.')
    }
  }

  private async validate (config: ServiceConfig, response: ServiceProperties): Promise<boolean | string> {
    return true
  }

  private async result (config: ServiceConfig, prompt: ServicePrompt): Promise<ServiceProperties> {
    const response = {} as ServiceProperties

    // initiate empty names as their paths
    if (prompt.name === '') {
      response.name = prompt.path
      this.logger.warn(`Name was empty for service, initiated it as "${prompt.path}".`)
    }

    // if item with given name already exists prompt first
    let overwritePrompt = true
    if (config?.[response?.name]) {
      overwritePrompt = await promptUser<boolean>({ type: 'Toggle', message: `Name "${response.name}" already exists in local configuration. Do you want to overwrite?` })
    }

    // check if regular expression
    if (new RegExp(/[!*?{}]/g).test(prompt.path)) {
      response.path = prompt.path.split(':')
      response.regex = parseInt(await promptUser<string>({
        type: 'Input',
        message: 'This looks like a regular expression. Please set a depth to search for docker-compose files:',
        initial: '1',
        validate: (value): boolean | string => {
          if (parseInt(value, 10) && parseInt(value, 10) > 0) {
            return true
          } else {
            return 'Search depth must be a positive number.'
          }
        }
      }), 10)
    } else {
      response.path = [ prompt.path ]
    }

    // abort mission on certain occasions, and return the prompt on the valid ones
    if (overwritePrompt) {
      return response
    } else {
      return
    }
  }
}
