import { Body, Column, Container, Head, Heading, Hr, Html, Row, Text } from '@react-email/components'
import * as React from 'react'

const fmt = (n: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n)

export interface Cust04Props {
  order_number: string
  customer_name: string
  delivery_date: string
  delivery_window: string
  items: { name: string; weight_label: string; quantity: number; subtotal: number }[]
  total_amount: number
}

export default function Cust04({ order_number, customer_name, delivery_date, delivery_window, items, total_amount }: Cust04Props) {
  return (
    <Html><Head />
      <Body style={{ backgroundColor: '#f5f5f5', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '32px auto', backgroundColor: '#fff', borderRadius: '8px', padding: '32px' }}>
          <Heading style={{ fontSize: '22px', color: '#111' }}>✅ Order Confirmed!</Heading>
          <Text style={{ color: '#555', marginTop: '0' }}>
            Hi {customer_name}, your order <strong>{order_number}</strong> has been confirmed. We'll prepare your delivery as scheduled.
          </Text>
          <Hr />
          <Heading as="h2" style={{ fontSize: '16px', color: '#333' }}>Order Summary</Heading>
          {items.map((item, i) => (
            <Row key={i} style={{ marginBottom: '6px' }}>
              <Column><Text style={{ margin: '0', fontSize: '14px' }}>{item.name} · {item.weight_label} × {item.quantity}</Text></Column>
              <Column align="right"><Text style={{ margin: '0', fontSize: '14px' }}>{fmt(item.subtotal)}</Text></Column>
            </Row>
          ))}
          <Hr />
          <Row>
            <Column><Text style={{ fontWeight: 'bold', margin: '0' }}>Total</Text></Column>
            <Column align="right"><Text style={{ fontWeight: 'bold', margin: '0' }}>{fmt(total_amount)}</Text></Column>
          </Row>
          <Hr />
          <Text style={{ fontSize: '14px', color: '#333' }}>
            <strong>Delivery date:</strong> {delivery_date}<br />
            <strong>Time window:</strong> {delivery_window}
          </Text>
          <Hr />
          <Text style={{ fontSize: '14px', color: '#555' }}>
            Please be available to receive your delivery during the scheduled window. We'll be in touch if anything changes.
          </Text>
          <Hr />
          <Text style={{ fontSize: '12px', color: '#999' }}>Lavaca MNL · Message us on Messenger for questions.</Text>
        </Container>
      </Body>
    </Html>
  )
}
