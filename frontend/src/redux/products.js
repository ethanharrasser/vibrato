// Actions

const LOAD_PRODUCTS = 'products/loadProducts';
const LOAD_CURRENT_PRODUCT = 'products/loadCurrentProduct';

export const loadProducts = (products, count) => {
    return {
        type: LOAD_PRODUCTS,
        products,
        count,
    }
};

export const loadCurrentProduct = (currentProduct) => {
    return {
        type: LOAD_CURRENT_PRODUCT,
        currentProduct,
    }
};

// Thunks

export const thunkLoadProducts = (filters) => async (dispatch) => {
    console.log(filters);
    let url = 'api/products';
    if (filters) {
        if ('excludeUser' in filters) {
            url += '?exclude_user_id=' + encodeURIComponent(`${filters.excludeUser.id}`);
        }
    }

    const response = await fetch(url);
    if (response.ok) {
        const data = await response.json();
        const products = {}; // Normalizing data
        data.products.forEach(product => products[product.id] = product);
        dispatch(loadProducts(products, data.count));
    } else if (response.status < 500) {
        const errors = await response.json();
        return errors;
    } else {
        return { server: 'Something went wrong. Please try again' };
    }
};

export const thunkLoadUserProducts = (user) => async (dispatch) => {
    const url = '/api/products?owner_id=' + encodeURIComponent(`${user.id}`);
    const response = await fetch(url);
    if (response.ok) {
        const data = await response.json();
        const products = {}; // Normalizing data
        data.products.forEach(product => products[product.id] = product);
        await dispatch(loadProducts(products, data.count));
    } else if (response.status < 500) {
        const errors = await response.json();
        return errors;
    } else {
        return { server: 'Something went wrong. Please try again' };
    }
};

export const thunkLoadCurrentProduct = (productId) => async (dispatch) => {
    const response = await fetch(`/api/products/${productId}`);
    if (response.ok) {
        const data = await response.json();
        dispatch(loadCurrentProduct(data.product));
    } else if (response.status < 500) {
        const errors = await response.json();
        return errors;
    } else {
        return { server: 'Something went wrong. Please try again' };
    }
};

export const thunkNewProduct = (product) => async (dispatch) => {
    const response = await fetch('/api/products/new', {
        method: 'POST',
        body: product,
    });

    if (response.ok) {
        const newProduct = await response.json();
        await dispatch(loadCurrentProduct(newProduct));
        return { product: newProduct }; // Return product for redirecting
    } else if (response.status < 500) {
        const errors = await response.json();
        return errors;
    } else {
        return { server: 'Something went wrong. Please try again' }
    }
};

export const thunkEditProduct = (product) => async (dispatch) => {
    const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        body: product,
    });

    if (response.ok) {
        const editedProduct = await response.json();
        await dispatch(loadCurrentProduct(editedProduct));
        return { product: editedProduct }; // Return product for redirecting
    } else if (response.status < 500) {
        const errors = await response.json();
        return errors;
    } else {
        return { server: 'Something went wrong. Please try again' }
    }
};

// Reducer

const initialState = { products: null, currentProduct: null };

const productsReducer = (state = initialState, action) => {
    switch (action.type) {
        case LOAD_PRODUCTS:
            return { ...state, products: action.products, count: action.count };
        case LOAD_CURRENT_PRODUCT:
            return { ...state, currentProduct: action.currentProduct };
        default:
            return state;
    }
};

export default productsReducer;
