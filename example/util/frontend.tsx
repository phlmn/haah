import { Switch, Form, SwitchProps } from 'antd';
import React from 'react';

export function LabeledSwitch<T>({label, ...rest}: {label: string} & SwitchProps) {
  return (
    <Form.Item label={label} labelCol={{ span: 20 }} wrapperCol={{ span: 4 }} labelAlign='left'>
      <Switch {...rest}/>
    </Form.Item>
  )
}
