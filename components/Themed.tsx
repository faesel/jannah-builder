import * as React from 'react'
import { PickerItemProps, Text as DefaultText, TextInput as DefaultTextInput, View as DefaultView } from 'react-native'
import { Picker as DefaultPicker } from '@react-native-community/picker'

import Colors from '../constants/Colors'
import useColorScheme from '../hooks/useColorScheme'

export function useThemeColor (
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme()
  const colorFromProps = props[theme]

  if (colorFromProps) {
    return colorFromProps
  } else {
    return Colors[theme][colorName]
  }
}

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];
export type TextInputProps = ThemeProps & DefaultTextInput['props'];
export type PickerProps = ThemeProps & IPickerProps & DefaultPicker['props'];

export function Text (props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'onBackground')

  return <DefaultText style={[{ color }, style]} {...otherProps} />
}

export function View (props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background')

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />
}

export function TextInput (props: TextInputProps) {
  const { style, lightColor, darkColor, ...otherProps } = props
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'onBackground')

  return <DefaultTextInput style={[{ color }, style]} {...otherProps} />
}

export interface IPickerProps
{
  pickerItems: IPickerItem[]
}

export interface IPickerItem {
  label: string,
  value: string,
}

export function Picker (props: PickerProps) {
  const { style, lightColor, darkColor, ...otherProps } = props
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'onBackground')

  return (
    <DefaultPicker style={[{ color }, style]} {...otherProps}>
      {props.pickerItems.map((item, index) =>
        <DefaultPicker.Item key={index} label={item.label} value={item.value}></DefaultPicker.Item>
      )}
    </DefaultPicker>
  )
}
