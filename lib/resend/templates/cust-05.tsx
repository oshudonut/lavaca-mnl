import { Body, Container, Head, Heading, Hr, Html, Text } from '@react-email/components'
import * as React from 'react'

export interface Cust05Props {
  order_number: string
  customer_name: string
  cancellation_reason: string
}

export default function Cust05({ order_number, customer_name, cancellation_reason }: Cust05Props) {
  return (
    <Html><Head />
      <Body style={{ backgroundColor: '#f5f5f5', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '32px auto', backgroundColor: '#fff', borderRadius: '8px', padding: '32px' }}>
          <Heading style={{ fontSize: '22px', color: '#111' }}>Your order has been cancelled</Heading>
          <Text style={{ color: '#555', marginTop: '0' }}>
            Hi {customer_name}, your order <strong>{order_number}</strong> has been cancelled.
          </Text>
          <Hr />
          <Text style={{ fontSize: '14px', color: '#333' }}>
            <strong>Reason:</strong> {cancellation_reason}
          </Text>
          <Hr />
          <Text style={{ fontSize: '14px', color: '#555' }}>
            If you have questions or would like to place a new order, please visit our page or message us on Messenger.
          </Text>
          <Hr />
          <Text style={{ fontSize: '12px', color: '#999' }}>Lavaca MNL · We're sorry for the inconvenience.</Text>
        </Container>
      </Body>
    </Html>
  )
}
