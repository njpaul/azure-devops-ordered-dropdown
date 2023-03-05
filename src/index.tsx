import {
  IWorkItemFormService,
  IWorkItemNotificationListener,
  WorkItemTrackingServiceIds
} from 'azure-devops-extension-api/WorkItemTracking'
import * as SDK from 'azure-devops-extension-sdk'
import { ObservableArray } from 'azure-devops-ui/Core/Observable'
import { EditableDropdown } from 'azure-devops-ui/EditableDropdown'

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'

import 'azure-devops-ui/Core/override.css'

import './index.css'
import { ListSelection } from 'azure-devops-ui/List'
import { Dropdown } from 'azure-devops-ui/Dropdown'

type OrderedDropdownProps = {
  items: string[],
  selected?: string,
  onSelect: (value: string | undefined) => void,
  onCollapse: () => void,
  onExpand: () => void,
}

// const OrderedDropdown = (props: OrderedDropdownProps): JSX.Element => {
//   const [expanded, setExpanded] = useState(false)
//   const [toggling, setToggling] = useState(false)
//   const selection = new ListSelection({ selectOnFocus: true })

//   // Used to return focus to the field
//   const textField = useRef<TextField>(null)

//   const toggleExpanded = () => {
//     if (expanded) {
//       setExpanded(false)
//     }
//     else {
//       setExpanded(true)
//     }
//   }

//   const renderListItem = (
//     index: number,
//     item: string,
//     details: IListItemDetails<string>,
//     key?: string
//   ) => (
//     <ListItem
//       key={key || "list-item" + index}
//       index={index}
//       details={details}
//       className='od-list-item'
//     >
//       <div className='od-content'>
//         {item}
//       </div>
//     </ListItem>
//   )

//   const setListSelection = () => {
//     if (typeof props.selected !== 'undefined') {
//       const selectedIndex = props.items.indexOf(props.selected)
//       if (selectedIndex >= 0) {
//         selection.select(selectedIndex)
//       }
//     }
//   }

//   setListSelection()
//   return (
//     <div className='ordered-dropdown'
//       // Use the React focus events instead of the properties on the Azure UI
//       // components. The components use different semantics than the standard
//       // DOM. Specifically, the list's onFocus event fires before the text
//       // field's onBlur. We also don't get access to the event. To unexpected
//       // behaviors like that, we'll use the React versions of these events.

//       onFocus={(e) => {
//         if (!toggling) {
//           setExpanded(true)
//         }
//       }}
//       onBlur={(e) => {
//         // Triggered when focus is lost to an element outside of the component.
//         // The suffix icon in the TextField is not a real DOM object, it's
//         // rendered as a pseudo element. Therefore relatedTarget will be null.
//         // To get around this, we keep track of a toggling state. We could
//         // instead render the suffix icon ourselves.
//         if (!e.currentTarget.contains(e.relatedTarget) && !toggling) {
//             setExpanded(false)
//         }
//       }}

//       // Prevent getting stuck on toggling if the user holds down the mouse
//       // after clicking the down arrow, then drags away with the mouse held.
//       onMouseLeave={() => setToggling(false)}
//     >
//       <TextField
//         readOnly={true}
//         value={props.selected}
//         ref={textField}
//         onClick={() => {
//           // Expand when the user clicks into the text field. This can happen
//           // even if we've got focus. The list may have been collapsed using the
//           // icon, in which case clicking in the text field should expand the
//           // selection.
//           setExpanded(true)
//         }}
//         suffixIconProps={{
//           iconName: 'ChevronDown',
//           size: IconSize.small,
//           className: 'od-down-arrow',
//           onMouseDown: (e) => {
//             setToggling(true)

//             // Give the TextField focus again after mouse down. We have to delay
//             // to let the onBlur event process first, which happens because this
//             // icon isn't actually in the DOM.
//             window.setTimeout(() => {
//               const el = textField.current
//               if (el) {
//                 el.focus()
//               }
//             }, 1)
//           },
//           onClick: () => {
//             toggleExpanded()
//             setToggling(false)
//           },
//         }}
//         onChange={(e, newValue) => console.log(newValue)}
//         className='od-textfield'
//         inputClassName='od-input'
//       />
//       {expanded
//         ? (
//           <div className='od-list-wrapper'>
//             <ScrollableList
//               width='100%'
//               itemProvider={new ArrayItemProvider(props.items)}
//               selection={selection}
//               onSelect={(_, row) => {
//                 props.onSelect(row.data?.toString())
//                 setExpanded(false)
//               }}
//               className='od-list'
//               renderRow={renderListItem}
//             />
//           </div>
//         )
//         : null
//       }
//     </div>
//   )
// }

const OrderedDropdown = (props: OrderedDropdownProps): JSX.Element => {
  const [selection] = useState(new ListSelection())
  
  useEffect(() => {
    const selectionIndex = props.items.findIndex(i => i === props.selected)
    if (selectionIndex >= 0) {
      selection.select(selectionIndex)
    }
    else {
      selection.clear()
    }
    console.log(selectionIndex)
  })

  return (
    <EditableDropdown
      items={props.items}
      selection={selection}
      // onSelect={(e, item) => props.onSelect(item?.text)}
      onValueChange={newValue => props.onSelect(newValue?.text)}
      onCollapse={props.onCollapse}
      onExpand={props.onExpand}
    />
  )
}

const Extension = (): JSX.Element => {
  const [isLoading, setIsLoading] = useState(true)
  const [items, setItems] = useState<string[]>([])
  const [selected, setSelected] = useState('')
  const [expanded, setExpanded] = useState(false)
  const extensionElement = useRef<HTMLDivElement>(null)

  const initState = () =>
    Promise.all([
      getSuggestedValues(),
      getSelectionFromField()
    ])
      .then(([items, selection]) => {
        setItems(items)
        setSelected(selection)
        setIsLoading(false)
      })
  
  const registerEvents = () => {
    SDK.register<Partial<IWorkItemNotificationListener>>(
      SDK.getContributionId(),
      {
        onReset: () => initState(),
        onRefreshed: () => initState(),
        
        onFieldChanged: args => {
          const fieldRef = SDK.getConfiguration().witInputs.FieldName as string

          if (args.changedFields[fieldRef]) {
            setSelected(args.changedFields[fieldRef])
          }
        }
      }
    )
  }
  
  useEffect(() => {
    registerEvents()
    initState()
  }, [])


  // Resize the extension area as necessary
  // useLayoutEffect(() => {
  //   const root = document.documentElement
  //   console.log(root)
  //   console.log(root?.scrollWidth, root?.scrollHeight)
  //   SDK.resize(root?.scrollWidth, root?.scrollHeight)
  //   // SDK.resize(root?.scrollWidth, 500)
  // }, [expanded])
  useLayoutEffect(() => {
    SDK.resize(document.documentElement?.scrollWidth, 500)
  })

  // const resize = () => {
  //   const root = document.getElementById('root')
  //   console.log(root?.scrollWidth, root?.scrollHeight)
  //   SDK.resize(root?.scrollWidth, root?.scrollHeight)
  // }


  const setBackingFieldValue = async (value: string | undefined): Promise<void> => {
    if (!value) { return }

    const fieldRef = SDK.getConfiguration().witInputs.FieldName as string
    const service = await SDK.getService<IWorkItemFormService>(
      WorkItemTrackingServiceIds.WorkItemFormService
    )

    service.setFieldValue(fieldRef, value)
  }

  // Only render after we're done loading. The EditableDropdown captures the
  // items only on mount, unless we use an ObservableArray.
  return isLoading
    ? <></>
    : <OrderedDropdown
        items={items}
        selected={selected}
        onSelect={setBackingFieldValue}
        onCollapse={() => setExpanded(false)}
        onExpand={() => setExpanded(true)}
      />
}

const getSuggestedValues = async () => {
  const confValues = getConfigValues()
  const allowedValues = await getAllowedValues()
  return combineConfAndAllowedValues(confValues, allowedValues)
}

const getConfigValues = () => {
  const valuesString = SDK.getConfiguration().witInputs.Values as string
  return valuesString.split(";").map(v => v.trim()).filter((v) => !!v);
}

const getAllowedValues = async () => {
  const service = await SDK.getService<IWorkItemFormService>(
    WorkItemTrackingServiceIds.WorkItemFormService
  )

  const fieldRef = SDK.getConfiguration().witInputs.FieldName as string
  return service.getAllowedFieldValues(fieldRef) as Promise<string[]>
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

const getSelectionFromField = async () => {
  const fieldRef = SDK.getConfiguration().witInputs.FieldName as string
  const service = await SDK.getService<IWorkItemFormService>(
    WorkItemTrackingServiceIds.WorkItemFormService
  )

  return await service.getFieldValue(fieldRef, { returnOriginalValue: false }) as string
}


SDK.init({ applyTheme: true, loaded: true })
  .then(() => ReactDOM.render(<Extension />, document.getElementById('root')))