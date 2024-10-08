from flask import Blueprint, request
from flask_login import current_user, login_required
from sqlalchemy import desc

from ..utils.aws import get_unique_filename, upload_file_to_s3
from ..models import db, Product, ProductImage, User
from ..forms.product_form import ProductForm, EditProductForm


product_routes = Blueprint('products', __name__)


@product_routes.route('')
def products():
    """
    Query for all products with pagination.
    """
    base_query = Product.query

    # Query params

    user_id = request.args.get('user_id', type=int)
    if user_id:
        base_query = base_query.join(User).filter(User.id == user_id)

    exclude_user_id = request.args.get('exclude_user_id', type=int)
    if exclude_user_id:
        base_query = base_query.join(User).filter(User.id != exclude_user_id)

    # category = request.args.get('category', type=str)
    # if category:
    #     base_query = base_query.filter_by(category=category)

    sort_by = request.args.get('sort_by', type=str)
    if sort_by:
        if sort_by == 'newest':
            base_query = base_query.order_by(Product.created_at.asc())
        elif sort_by == 'oldest':
            base_query = base_query.order_by(Product.created_at.desc())

    page = request.args.get('page', type=int) or 1
    per_page = request.args.get('per_page', type=int) or 20

    products_count = base_query.count()
    products_query = base_query.paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )
    products = [product.to_dict() for product in products_query]

    return {
        'products': products,
        'count': products_count,
    }


@product_routes.route('/<product_id>', methods=['GET'])
def get_product_by_id(product_id: int):
    """
    Query for a product by id.
    """
    product = Product.query.get(product_id)

    if not product:
        return { 'errors': { 'message': 'Product not found' } }, 404

    return { 'product': product.to_dict() }


@product_routes.route('/<product_id>', methods=['PUT', 'DELETE'])
@login_required
def product_by_id(product_id: int):
    """
    Edit or delete a product by id.
    """
    product = Product.query.get(product_id)

    if not product:
        return { 'errors': { 'message': 'Product not found' } }, 404

    elif product.user.id != current_user.id:
        return { 'errors': { 'message': 'Unauthorized' } }, 401

    elif request.method == 'PUT':
        form = EditProductForm() # TODO: Add image editing
        form['csrf_token'].data = request.cookies['csrf_token']

        if form.validate_on_submit():
            product.name = form.data['name']
            product.brand = form.data['brand']
            product.category = form.data['category']
            product.condition = form.data['condition']
            product.description = form.data['description']
            product.product_price = form.data['product_price']
            product.shipping_price = form.data['shipping_price']
            product.quantity = form.data['quantity']

            if form.data['image_1']: # Only edit image if form sent new data
                image = form.data['image_1']
                image.filename = get_unique_filename(image.filename)
                upload = upload_file_to_s3(image)

                if 'url' not in upload: # Check for errors while uploading
                    return form.errors, 400

                # Fetch record id from parent product and replace file
                product_image_id = product.images[0].to_dict()['id']
                product_image = ProductImage.query.get(product_image_id)
                product_image.image = upload['url']

            db.session.commit()
            return product.to_dict()

        return form.errors, 400

    elif request.method == 'DELETE':
        db.session.delete(product)
        db.session.commit()
        return { 'message': 'Successfully deleted' }, 204


@product_routes.route('/new', methods=['POST'])
@login_required
def new_product():
    """
    Create a new Product instance and store it in the database.
    """
    form = ProductForm()
    form['csrf_token'].data = request.cookies['csrf_token']

    if form.validate_on_submit():
        product = Product(
            user_id=form.data['user_id'],
            shop_id=form.data['shop_id'],
            name=form.data['name'],
            brand=form.data['brand'],
            category=form.data['category'],
            condition=form.data['condition'],
            description=form.data['description'],
            product_price=form.data['product_price'],
            shipping_price=form.data['shipping_price'],
            quantity=form.data['quantity'],
        )

        db.session.add(product)
        db.session.flush() # Flush session to populate id field on product

        images = []
        for num in range(1, 6): # "Iterate" through form image fields
            if form.data[f'image_{num}']:
                image = form.data[f'image_{num}']
                image.filename = get_unique_filename(image.filename)
                upload = upload_file_to_s3(image)

                if 'url' not in upload: # Check for errors while uploading
                    return form.errors, 400

                images.append(ProductImage(
                    product_id=product.id,
                    image=upload['url']
                ))

        db.session.add_all(images)
        db.session.commit()
        return product.to_dict()
    else:
        return form.errors, 400
