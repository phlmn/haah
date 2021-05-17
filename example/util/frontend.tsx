import { Switch, Form, SwitchProps } from 'antd';
import React from 'react';

export function LabeledSwitch<T>({label, ...rest}: {label: string} & SwitchProps) {
  return (
    <Form.Item label={label} labelCol={{ span: 4 }}  wrapperCol={{ span: 14 }} style={{textAlign: 'end'}}>
      <Switch {...rest}/>
    </Form.Item>
  )
}
