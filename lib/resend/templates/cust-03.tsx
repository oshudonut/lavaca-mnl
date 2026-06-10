import { Body, Container, Head, Heading, Hr, Html, Link, Text } from '@react-email/components'
import * as React from 'react'

export interface Cust03Props {
  order_number: string
  customer_name: string
  rejection_reason: string
  payment_url: string
}

export default function Cust03({ order_number, customer_name, rejection_reason, payment_url }: Cust03Props) {
  return (
    <Html><Head />
      <Body style={{ backgroundColor: '#f5f5f5', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '32px auto', backgroundColor: '#fff', borderRadius: '8px', padding: '32px' }}>
          <Heading style={{ fontSize: '22px', color: '#111' }}>Payment not accepted</Heading>
          <Text style={{ color: '#555', marginTop: '0' }}>
            Hi {customer_name}, unfortunately we could not verify your payment for order <strong>{order_number}</strong>.
          </Text>
          <Hr />
          <Text style={{ fontSize: '14px', color: '#333' }}>
            <strong>Reason:</strong> {rejection_reason}
          </Text>
          <Hr />
          <Text style={{ fontSize: '14px', color: '#555' }}>
            Please re-upload a clear screenshot of your payment confirmation to keep your order active.
          </Text>
          <Link href={payment_url} style={{ display: 'inline-block', backgroundColor: '#2563eb', color: '#fff', borderRadius: '6px', padding: '10px 20px', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none', marginTop: '4px' }}>
            Re-upload Screenshot
          </Link>
          <Hr />
          <Text style={{ fontSize: '12px', color: '#999' }}>Lavaca MNL · Message us on Messenger for help.</Text>
        </Container>
      </Body>
    </Html>
  )
}
