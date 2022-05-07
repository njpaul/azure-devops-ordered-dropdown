# Azure DevOps Ordered Dropdown
Picklists in Azure DevOps work item forms order items alphabetically, but that isn't always the most logical order.
The traditional solution has been to add a prefix to your items, such as `1 - Zebra`.
But this isn't always practical, logical, or desired.

This is a dropdown control that lets you order items according to your business needs:

![image](https://user-images.githubusercontent.com/12118969/167268310-dd1d316e-c426-43ef-b39d-e2e967beeb56.png)


## How does it work?
The Ordered Dropdown is not an actual field, but rather a custom control that you can put on your work item form.
It accepts a backing field, which establishes the allowed values.
You can then define an order for some or all of the allowed values.

The backing field is synchronized with the Ordered Dropdown, so changes to one will also change the other.

_Since the Ordered Dropdown is a control, not a field, queries will need to be against the backing field._
_Likewise, the Ordered Dropdown cannot be shown in certain views, like on the Cards the "Board" view._
_However, the control can have the same name as its backing field._

## Usage
First you need a backing field for the control.
The field type for the backing field should be "Picklist (string)".
If you created a new backing field, enter the allowed values into the picklist.

![image](https://user-images.githubusercontent.com/12118969/167269161-4dc0cdea-743e-427e-a710-085665267a39.png)


After you have your backing field configured, you need to [install the extension and add it as a custom control](https://docs.microsoft.com/en-us/azure/devops/organizations/settings/work/custom-controls-process?view=azure-devops) to your work item form.
Then use the Options tab to configure the dropdown.

![image](https://user-images.githubusercontent.com/12118969/167269115-a106824f-ea2d-4cec-98fa-93aebcccfda3.png)

The values for the control are specified in a semicolon-delimited list.
Values that are allowed by the backing field, but which are not configured in this list, are be displayed after the configured items in the dropdown.
Any values that are defined in this list, but which are not present in the backing field, are ignored.

_You can and should give the control the same label as the name of the backing field in the Layout tab._
_If the backing field is marked as "required", the form validation will display the name of the field, not the control._

Now you can remove the backing field from the form layout.

## Limitations
These items may be addressed in future versions:
- There is no support for keyboard navigation or screen readers
- Filtering the list is not implemented
- You cannot add new items to the backing field through this control
