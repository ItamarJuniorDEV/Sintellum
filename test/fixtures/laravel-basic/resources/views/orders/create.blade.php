@extends('layouts.app')
@include('orders.partials.form')
<form method="POST" action="{{ route('orders.store') }}">
  @csrf
  <button type="submit">Salvar</button>
</form>
