import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import * as SDK from 'azure-devops-extension-sdk'
import {
  IWorkItemFieldChangedArgs,
  IWorkItemFormService,
  WorkItemTrackingServiceIds
} from 'azure-devops-extension-api/WorkItemTracking'
import { TextField } from 'azure-devops-ui/TextField'
import { IListItemDetails, ListItem, ListSelection, ScrollableList } from 'azure-devops-ui/List';
import { ArrayItemProvider } from 'azure-devops-ui/Utilities/Provider';

import 'azure-devops-ui/Core/override.css';
import './index.css'
import { IconSize } from 'azure-devops-ui/Icon'

type OrderedDropdownProps = {
  items: string[],
  selected?: string,
  onSelect: (value: string | undefined) => void,
  onExpand: () => void,
  onCollapse: () => void,
}

const OrderedDropdown = (props: OrderedDropdownProps): JSX.Element => {
  const [expanded, setExpanded] = useState(false)
  const [toggling, setToggling] = useState(false)
  const selection = new ListSelection({ selectOnFocus: true })

  // Used to return focus to the field
  const textField = useRef<TextField>(null)

  useLayoutEffect(() => {
    if (expanded) {
      props.onExpand()
    }
    else {
      props.onCollapse()
    }
  }, [expanded])

  const toggleExpanded = () => {
    if (expanded) {
      setExpanded(false)
    }
    else {
      setExpanded(true)
    }
  }

  const renderListItem = (
    index: number,
    item: string,
    details: IListItemDetails<string>,
    key?: string
  ) => (
    <ListItem
      key={key || "list-item" + index}
      index={index}
      details={details}
      className='od-list-item'
    >
      <div className='od-content'>
        {item}
      </div>
    </ListItem>
  )

  const setListSelection = () => {
    if (typeof props.selected !== 'undefined') {
      const selectedIndex = props.items.indexOf(props.selected)
      if (selectedIndex >= 0) {
        selection.select(selectedIndex)
      }
    }
  }

  setListSelection()
  return (
    <div className='ordered-dropdown'
      // Use the React focus events instead of the properties on the Azure UI
      // components. The components use different semantics than the standard
      // DOM. Specifically, the list's onFocus event fires before the text
      // field's onBlur. We also don't get access to the event. To unexpected
      // behaviors like that, we'll use the React versions of these events.

      onFocus={(e) => {
        if (!toggling) {
          setExpanded(true)
        }
      }}
      onBlur={(e) => {
        // Triggered when focus is lost to an element outside of the component.
        // The suffix icon in the TextField is not a real DOM object, it's
        // rendered as a pseudo element. Therefore relatedTarget will be null.
        // To get around this, we keep track of a toggling state. We could
        // instead render the suffix icon ourselves.
        if (!e.currentTarget.contains(e.relatedTarget) && !toggling) {
            setExpanded(false)
        }
      }}

      // Prevent getting stuck on toggling if the user holds down the mouse
      // after clicking the down arrow, then drags away with the mouse held.
      onMouseLeave={() => setToggling(false)}
    >
      <TextField
        readOnly={true}
        value={props.selected}
        ref={textField}
        onClick={() => {
          // Expand when the user clicks into the text field. This can happen
          // even if we've got focus. The list may have been collapsed using the
          // icon, in which case clicking in the text field should expand the
          // selection.
          setExpanded(true)
        }}
        suffixIconProps={{
          iconName: 'ChevronDown',
          size: IconSize.small,
          className: 'od-down-arrow',
          onMouseDown: (e) => {
            setToggling(true)

            // Give the TextField focus again after mouse down. We have to delay
            // to let the onBlur event process first, which happens because this
            // icon isn't actually in the DOM.
            window.setTimeout(() => {
              const el = textField.current
              if (el) {
                el.focus()
              }
            }, 1)
          },
          onClick: () => {
            toggleExpanded()
            setToggling(false)
          },
        }}
        className='od-textfield'
        inputClassName='od-input'
      />
      {expanded
        ? (
          <div className='od-list-wrapper'>
            <ScrollableList
              width='100%'
              itemProvider={new ArrayItemProvider(props.items)}
              selection={selection}
              onSelect={(_, row) => {
                props.onSelect(row.data?.toString())
                setExpanded(false)
              }}
              className='od-list'
              renderRow={renderListItem}
            />
          </div>
        )
        : null
      }
    </div>
  )
}


const OrderedDropdownExtension = (): JSX.Element => {
  const [items, setItems] = useState<string[]>([])
  const [selected, setSelected] = useState('')

  useEffect(() => {
    const init = async () => {
      await SDK.init({ applyTheme: true, loaded: true })
    }

    const getAllowedValues = async () => {
      const service = await SDK.getService<IWorkItemFormService>(
        WorkItemTrackingServiceIds.WorkItemFormService
      )

      const fieldRef = SDK.getConfiguration().witInputs.FieldName as string
      return service.getAllowedFieldValues(fieldRef) as Promise<string[]>
    }

    const getConfigValues = () => {
      const valuesString = SDK.getConfiguration().witInputs.Values as string
      return valuesString.split(";").map(v => v.trim()).filter((v) => !!v);
    }

    const getSuggestedValues = async () => {
      const confValues = getConfigValues()
      const allowedValues = await getAllowedValues()
      return combineConfAndAllowedValues(confValues, allowedValues)
    }

    const setDropdownSelection = async () => {
      const fieldRef = SDK.getConfiguration().witInputs.FieldName as string
      const service = await SDK.getService<IWorkItemFormService>(
        WorkItemTrackingServiceIds.WorkItemFormService
      )

      const value = await service.getFieldValue(fieldRef, { returnOriginalValue: false }) as string
      setSelected(value)
    }

    const registerEvents = () => {
      const fieldRef = SDK.getConfiguration().witInputs.FieldName as string

      SDK.register(SDK.getContributionId(), () => ({
        onFieldChanged: (args: IWorkItemFieldChangedArgs) => {
          if (args.changedFields[fieldRef]) {
            setSelected(args.changedFields[fieldRef])
          }
        }
      }))
    }

    init()
      .then(registerEvents)
      .then(getSuggestedValues)
      .then(items => setItems(items))
      .then(() => setDropdownSelection())
  }, [])


  useLayoutEffect(() => SDK.resize())


  const setBackingFieldValue = async (value: string | undefined): Promise<void> => {
    if (!value) { return }

    const fieldRef = SDK.getConfiguration().witInputs.FieldName as string
    const service = await SDK.getService<IWorkItemFormService>(
      WorkItemTrackingServiceIds.WorkItemFormService
    )

    service.setFieldValue(fieldRef, value)
  }

  const expand = () => {
    SDK.resize()
  }

  const collapse = () => {
    SDK.resize(void 0, 40)
  }

  return <OrderedDropdown
    items={items}
    selected={selected}
    onSelect={setBackingFieldValue}
    onExpand={expand}
    onCollapse={collapse}
  />
}

/**
 * Filter out disallowed values from the configuration, then order the allowed
 * values according to the configuration. Unspecified allowed values are added
 * in order of appearance to the end of the list.
 */
const combineConfAndAllowedValues = (confValues: string[], allowedValues: string[]): string[] => {
  const filteredConfValues = confValues.filter(v => allowedValues.includes(v))
  return [...new Set([...filteredConfValues, ...allowedValues])]
}

ReactDOM.render(<OrderedDropdownExtension />, document.getElementById('root'))
