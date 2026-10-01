<?php
namespace App\Http\Requests;
class StoreOrderRequest {
    public function authorize(): bool { return true; }
    public function rules(): array { return ['customer_id' => ['required','integer']]; }
}
