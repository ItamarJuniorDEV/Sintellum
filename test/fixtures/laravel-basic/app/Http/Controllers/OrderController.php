<?php
namespace App\Http\Controllers;
use App\Http\Requests\StoreOrderRequest;
use App\Services\OrderService as Orders;
class OrderController {
    public function __construct(private Orders $orderService) {}
    public function store(StoreOrderRequest $request) {
        $dados = $request->validated();
        $order = $this->orderService->create($dados);
        return redirect()->route('orders.show', $order);
    }
}
